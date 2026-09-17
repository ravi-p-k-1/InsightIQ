import { searchFredSeries } from '../clients/fred.js'
import { toFredSearchPhrase } from '../utils/searchPhrase.js'

const defaultSeriesLimit = 4
const defaultCandidateLimit = 20

function calculateRerankScore(result) {
  return result.reciprocalRank + Math.log1p(result.popularity) * 0.01
}

function selectDiverseSeries(results, limit) {
  const selected = []
  const normalizedTitlePrefixes = new Set()

  for (const result of results) {
    const titlePrefix = result.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .slice(0, 5)
      .join(' ')

    if (normalizedTitlePrefixes.has(titlePrefix) && selected.length > 0) {
      continue
    }

    selected.push(result)
    normalizedTitlePrefixes.add(titlePrefix)

    if (selected.length === limit) {
      break
    }
  }

  return selected
}

function mergeSearchResults(resultsByPhrase, candidateLimit) {
  const merged = new Map()

  for (const rows of resultsByPhrase) {
    rows.forEach((row, index) => {
      if (!row.id || !row.title) {
        return
      }

      const reciprocalRank = 1 / (index + 1)
      const existing = merged.get(row.id)

      if (existing) {
        existing.reciprocalRank += reciprocalRank
        return
      }

      merged.set(row.id, {
        seriesId: row.id,
        title: row.title,
        popularity: Number(row.popularity) || 0,
        reciprocalRank,
      })
    })
  }

  return [...merged.values()]
    .sort((left, right) => calculateRerankScore(right) - calculateRerankScore(left))
    .slice(0, candidateLimit)
}

export async function getFredSeriesForQueries(phrases, options = {}) {
  const limit = options.limit ?? defaultSeriesLimit
  const candidateLimit = Math.max(options.candidateLimit ?? defaultCandidateLimit, limit)
  const searchPhrases = [
    ...new Set(
      phrases
        .map((phrase) => phrase.trim())
        .filter(Boolean)
        .map(toFredSearchPhrase),
    ),
  ]

  if (searchPhrases.length === 0) {
    return []
  }

  let resultsByPhrase

  try {
    resultsByPhrase = await Promise.all(
      searchPhrases.map((phrase) =>
        searchFredSeries(phrase, {
          limit: candidateLimit,
          tagNames: options.tagNames,
          excludeTagNames: options.excludeTagNames,
        }),
      ),
    )
  } catch (error) {
    throw new Error(`Unable to search the FRED series catalog: ${error.message}`)
  }

  const rankedResults = mergeSearchResults(resultsByPhrase, candidateLimit)

  return selectDiverseSeries(rankedResults, limit).map(({ seriesId, title }) => ({
    seriesId,
    title,
  }))
}
