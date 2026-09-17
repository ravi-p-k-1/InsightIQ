import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { createEvalClient, parseToolJson } from './client.js'

const defaultQuestionsPath = 'evals/questions.json'
const defaultPlansPath = 'evals/queryPlans.json'
const defaultLimit = 5

function parseStringOption(name, fallback) {
  const optionIndex = process.argv.indexOf(name)

  if (optionIndex === -1) {
    return fallback
  }

  const value = process.argv[optionIndex + 1]

  if (!value) {
    throw new Error(`${name} requires a value.`)
  }

  return value
}

function parsePositiveIntegerOption(name, fallback) {
  const optionIndex = process.argv.indexOf(name)

  if (optionIndex === -1) {
    return fallback
  }

  const value = Number.parseInt(process.argv[optionIndex + 1], 10)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`)
  }

  return value
}

function validateQuestions(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Evaluation questions must be a non-empty array.')
  }

  return value.map((item, index) => {
    if (typeof item.question !== 'string' || item.question.trim() === '') {
      throw new Error(`Question ${index + 1} is missing a question string.`)
    }

    if (!Array.isArray(item.relevantSeries) || item.relevantSeries.length === 0) {
      throw new Error(`Question ${index + 1} is missing relevantSeries.`)
    }

    return {
      question: item.question.trim(),
      relevantSeries: item.relevantSeries.map((seriesId) => String(seriesId).toUpperCase()),
    }
  })
}

function validatePlans(value, questions) {
  if (!Array.isArray(value) || value.length !== questions.length) {
    throw new Error(
      `queryPlans.json must have exactly one entry per question in the same order ` +
        `(expected ${questions.length}, got ${Array.isArray(value) ? value.length : 'non-array'}).`,
    )
  }

  return value.map((plan, index) => {
    const question = questions[index]

    if (plan.question !== question.question) {
      throw new Error(
        `Plan ${index + 1} is out of sync with questions.json.\n` +
          `  Plan question:     ${plan.question}\n` +
          `  Questions.json:    ${question.question}\n` +
          `Update queryPlans.json to match, or re-order it.`,
      )
    }

    if (!Array.isArray(plan.queries) || plan.queries.length === 0) {
      throw new Error(`Plan ${index + 1} is missing queries.`)
    }

    return {
      queries: plan.queries,
      tags: plan.tags,
      excludeTags: plan.excludeTags,
    }
  })
}

async function loadJson(path) {
  const text = await readFile(path, 'utf8')
  return JSON.parse(text)
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`
}

const limit = parsePositiveIntegerOption('--limit', defaultLimit)
const questionsPath = parseStringOption('--questions', defaultQuestionsPath)
const plansPath = parseStringOption('--plans', defaultPlansPath)
const questions = validateQuestions(await loadJson(questionsPath))
const plans = validatePlans(await loadJson(plansPath), questions)

console.log(`Evaluation questions: ${questions.length.toLocaleString()}`)
console.log(`Retrieval limit: ${limit.toLocaleString()}`)
console.log(`Questions file: ${questionsPath}`)
console.log(`Query plans file: ${plansPath}`)
console.log(
  'Driven via: the real search_economic_series MCP tool, using curated per-question search ' +
    'phrases/tags (a fixed stand-in for what a good agent would choose) instead of the raw ' +
    'question — this measures the ceiling the tools enable, not the no-intelligence floor ' +
    '(see eval:retrieval for that).',
)

const { client, close } = await createEvalClient()

try {
  let recallSum = 0
  let responseTimeSumMs = 0

  for (const [index, item] of questions.entries()) {
    const plan = plans[index]
    const startedAt = performance.now()
    const result = await client.callTool({
      name: 'search_economic_series',
      arguments: {
        queries: plan.queries,
        limit,
        ...(plan.tags ? { tags: plan.tags } : {}),
        ...(plan.excludeTags ? { excludeTags: plan.excludeTags } : {}),
      },
    })
    const responseTimeMs = performance.now() - startedAt

    const retrievedIds = result.isError
      ? []
      : parseToolJson(result).series.map((series) => series.seriesId.toUpperCase())
    const relevantSet = new Set(item.relevantSeries)
    const matchedIds = retrievedIds.filter((seriesId) => relevantSet.has(seriesId))
    const recall = matchedIds.length / relevantSet.size

    recallSum += recall
    responseTimeSumMs += responseTimeMs

    console.log('')
    console.log(`${index + 1}. ${item.question}`)
    console.log(`   Plan: ${JSON.stringify(plan.queries)}${plan.tags ? ` tags=${JSON.stringify(plan.tags)}` : ''}`)
    console.log(`   Retrieved (${retrievedIds.length}): ${retrievedIds.join(', ') || 'none'}`)
    console.log(`   Relevant: ${item.relevantSeries.join(', ')}`)
    console.log(`   Matches: ${matchedIds.join(', ') || 'none'}`)
    console.log(`   Recall@${limit}: ${formatPercent(recall)} | Time: ${responseTimeMs.toFixed(0)}ms`)
  }

  const averageRecall = recallSum / questions.length
  const averageResponseTimeMs = responseTimeSumMs / questions.length

  console.log('')
  console.log('Smart Retrieval Recall Eval Summary')
  console.log(`Recall@${limit}: ${formatPercent(averageRecall)}`)
  console.log(`Average response time: ${averageResponseTimeMs.toFixed(0)}ms`)
  console.log(`Questions evaluated: ${questions.length.toLocaleString()}`)
} catch (error) {
  console.error('')
  console.error('Unable to run smart retrieval recall eval.')
  console.error(`Details: ${error.message}`)
  process.exitCode = 1
} finally {
  await close()
}
