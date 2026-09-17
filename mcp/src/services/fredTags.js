import { searchFredSeriesTags } from '../clients/fred.js'
import { toFredSearchPhrase } from '../utils/searchPhrase.js'

const defaultTagLimit = 20

export async function getSeriesTagsForQuery(query, options = {}) {
  const phrase = toFredSearchPhrase(query.trim())

  let tags

  try {
    tags = await searchFredSeriesTags(phrase, { limit: options.limit ?? defaultTagLimit })
  } catch (error) {
    throw new Error(`Unable to look up FRED series tags: ${error.message}`)
  }

  return tags.map((tag) => ({
    name: tag.name,
    groupId: tag.group_id,
    seriesCount: Number(tag.series_count) || 0,
    popularity: Number(tag.popularity) || 0,
  }))
}
