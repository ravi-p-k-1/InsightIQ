import { z } from 'zod'
import { getFredSeriesForQueries } from '../services/fredSearch.js'

export const name = 'search_economic_series'

export const config = {
  title: 'Search economic series',
  description:
    'Search FRED (Federal Reserve Economic Data) for real economic data series matching a topic. ' +
    'Returns real FRED series IDs and titles only — never invents series IDs. ' +
    'Provide 1-3 concise, FRED-style keyword phrases (e.g. "consumer price index", "Texas unemployment rate"), ' +
    'not a full conversational question — FRED search matches every word in a phrase, so short, ' +
    'specific phrases work far better than full sentences. Include likely synonyms or named entities ' +
    '(a state, a specific indicator name) as separate phrases to improve recall.',
  inputSchema: {
    queries: z
      .array(z.string().min(1))
      .min(1)
      .max(3)
      .describe(
        '1 to 3 concise economic search phrases, e.g. ["inflation", "consumer price index"].',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe('Maximum number of series to return. Defaults to 4.'),
    tags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Optional FRED tag names that returned series must ALL have (e.g. ["usa", "state"] to force ' +
          'state-level series). Use list_series_tags first to find valid tag names for your topic — an ' +
          'unrecognized tag silently returns zero results instead of erroring.',
      ),
    excludeTags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Optional FRED tag names that returned series must NOT have (e.g. ["nsa"] to exclude ' +
          'seasonally-unadjusted series).',
      ),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
}

export async function handler({ queries, limit, tags, excludeTags }) {
  const series = await getFredSeriesForQueries(queries, {
    limit,
    tagNames: tags,
    excludeTagNames: excludeTags,
  })

  if (series.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No matching FRED series were found. Try different or more specific search phrases.',
        },
      ],
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ series }, null, 2) }],
  }
}
