import { createEvalClient, parseToolJson } from './client.js'

const expectedToolNames = [
  'search_economic_series',
  'get_series_observations',
  'get_economic_data',
  'list_series_tags',
]

let passCount = 0
let failCount = 0

function check(description, condition) {
  if (condition) {
    passCount += 1
    console.log(`  PASS  ${description}`)
  } else {
    failCount += 1
    console.log(`  FAIL  ${description}`)
  }
}

const { client, close } = await createEvalClient()

try {
  console.log('Tool inventory')
  const { tools } = await client.listTools()
  const actualNames = tools.map((tool) => tool.name).sort()
  check(
    `exposes exactly the expected tools (${expectedToolNames.join(', ')})`,
    JSON.stringify(actualNames) === JSON.stringify([...expectedToolNames].sort()),
  )
  check(
    'every tool declares a non-empty input schema',
    tools.every((tool) => tool.inputSchema && Object.keys(tool.inputSchema.properties ?? {}).length > 0),
  )

  console.log('')
  console.log('Protocol-level error handling (bad tool name / schema violations)')

  const unknownTool = await client.callTool({ name: 'not_a_real_tool', arguments: {} })
  check('unknown tool name returns isError instead of throwing', unknownTool.isError === true)

  const emptyQueries = await client.callTool({
    name: 'search_economic_series',
    arguments: { queries: [] },
  })
  check('search_economic_series rejects an empty queries array', emptyQueries.isError === true)

  const missingQuestion = await client.callTool({
    name: 'get_economic_data',
    arguments: {},
  })
  check('get_economic_data rejects a missing required field', missingQuestion.isError === true)

  const emptySeries = await client.callTool({
    name: 'get_series_observations',
    arguments: { series: [] },
  })
  check('get_series_observations rejects an empty series array', emptySeries.isError === true)

  const missingTagQuery = await client.callTool({
    name: 'list_series_tags',
    arguments: {},
  })
  check('list_series_tags rejects a missing required field', missingTagQuery.isError === true)

  const outOfRangeLimit = await client.callTool({
    name: 'search_economic_series',
    arguments: { queries: ['inflation'], limit: 999 },
  })
  check('search_economic_series rejects an out-of-range limit', outOfRangeLimit.isError === true)

  console.log('')
  console.log('Domain-level error handling (schema-valid but semantically invalid input)')

  const badSeriesId = await client.callTool({
    name: 'get_series_observations',
    arguments: { series: [{ seriesId: 'not-a-valid-id!!' }] },
  })
  check(
    'get_series_observations rejects a schema-valid but malformed series ID',
    badSeriesId.isError === true,
  )

  console.log('')
  console.log('Happy paths (live FRED calls)')

  const searchResult = await client.callTool({
    name: 'search_economic_series',
    arguments: { queries: ['unemployment rate'] },
  })
  const searchData = !searchResult.isError && parseToolJson(searchResult)
  check(
    'search_economic_series returns at least one real series for a common query',
    !searchResult.isError && Array.isArray(searchData.series) && searchData.series.length > 0,
  )

  const observationsResult = await client.callTool({
    name: 'get_series_observations',
    arguments: { series: [{ seriesId: 'UNRATE', title: 'Unemployment Rate' }] },
  })
  const observationsData = !observationsResult.isError && parseToolJson(observationsResult)
  check(
    'get_series_observations returns observations for a known-good series ID',
    !observationsResult.isError &&
      Array.isArray(observationsData.series) &&
      observationsData.series[0]?.observations?.length > 0,
  )

  const dataResult = await client.callTool({
    name: 'get_economic_data',
    arguments: { question: 'What is happening with inflation?' },
  })
  const data = !dataResult.isError && parseToolJson(dataResult)
  check(
    'get_economic_data chains search and observations end to end',
    !dataResult.isError && Array.isArray(data.series) && data.series.length > 0,
  )

  const tagsResult = await client.callTool({
    name: 'list_series_tags',
    arguments: { query: 'unemployment rate' },
  })
  const tagsData = !tagsResult.isError && parseToolJson(tagsResult)
  check(
    'list_series_tags returns real tags with series counts for a common query',
    !tagsResult.isError &&
      Array.isArray(tagsData.tags) &&
      tagsData.tags.length > 0 &&
      typeof tagsData.tags[0].seriesCount === 'number',
  )

  const limitedResult = await client.callTool({
    name: 'search_economic_series',
    arguments: { queries: ['inflation'], limit: 2 },
  })
  const limitedData = !limitedResult.isError && parseToolJson(limitedResult)
  check(
    'search_economic_series honors a custom limit',
    !limitedResult.isError && limitedData.series.length <= 2,
  )

  const taggedResult = await client.callTool({
    name: 'search_economic_series',
    arguments: { queries: ['unemployment rate'], tags: ['usa', 'state'] },
  })
  const taggedData = !taggedResult.isError && parseToolJson(taggedResult)
  check(
    'search_economic_series tags filter actually narrows results (state-level only)',
    !taggedResult.isError &&
      taggedData.series.length > 0 &&
      taggedData.series.every((series) => series.title.startsWith('Unemployment Rate in ')),
  )

  const excludeTaggedResult = await client.callTool({
    name: 'search_economic_series',
    arguments: {
      queries: ['unemployment rate'],
      tags: ['usa', 'state'],
      excludeTags: ['ca'],
    },
  })
  const excludeTaggedData = !excludeTaggedResult.isError && parseToolJson(excludeTaggedResult)
  check(
    'search_economic_series excludeTags filter actually removes matching results (no California)',
    !excludeTaggedResult.isError &&
      excludeTaggedData.series.length > 0 &&
      excludeTaggedData.series.every((series) => !series.title.includes('California')),
  )
} finally {
  await close()
}

console.log('')
console.log(`Tool Contract Eval: ${passCount} passed, ${failCount} failed`)

if (failCount > 0) {
  process.exitCode = 1
}
