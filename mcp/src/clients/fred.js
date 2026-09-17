import { getRequiredEnv } from '../utils/env.js'
import { createRateLimiter, wait } from '../utils/rateLimiter.js'

const fredApiBaseUrl = 'https://api.stlouisfed.org/fred'
const fredMaxAttempts = 5
// Matches FRED's documented rate limit - not user-configurable since there's
// no reason a caller would need a different value for FRED's own API.
const fredRequestsPerMinute = 120
const defaultSearchLimit = 20
const defaultTagLimit = 20

const waitForRequestSlot = createRateLimiter(fredRequestsPerMinute)

export async function fetchFredJson(endpoint, parameters = {}) {
  const url = new URL(`${fredApiBaseUrl}/${endpoint}`)
  url.searchParams.set('api_key', getRequiredEnv('FRED_API_KEY'))
  url.searchParams.set('file_type', 'json')

  for (const [name, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(name, String(value))
    }
  }

  let lastError

  for (let attempt = 1; attempt <= fredMaxAttempts; attempt += 1) {
    await waitForRequestSlot()

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        return data
      }

      const error = new Error(
        data.error_message ?? `FRED request failed with status ${response.status}.`,
      )
      error.retryable = response.status === 429 || response.status >= 500
      throw error
    } catch (error) {
      lastError = error

      if (attempt === fredMaxAttempts || error.retryable === false) {
        throw error
      }

      const delay = 1000 * 2 ** (attempt - 1)
      console.error(`FRED request failed. Retrying in ${delay}ms...`)
      await wait(delay)
    }
  }

  throw lastError ?? new Error('FRED request failed after all retry attempts.')
}

export async function searchFredSeries(searchText, options = {}) {
  const data = await fetchFredJson('series/search', {
    search_text: searchText,
    search_type: 'full_text',
    order_by: 'search_rank',
    sort_order: 'desc',
    limit: options.limit ?? defaultSearchLimit,
    tag_names: options.tagNames?.length ? options.tagNames.join(';') : undefined,
    exclude_tag_names: options.excludeTagNames?.length
      ? options.excludeTagNames.join(';')
      : undefined,
  })

  return Array.isArray(data.seriess) ? data.seriess : []
}

export async function searchFredSeriesTags(searchText, options = {}) {
  const data = await fetchFredJson('series/search/tags', {
    series_search_text: searchText,
    order_by: 'series_count',
    sort_order: 'desc',
    limit: options.limit ?? defaultTagLimit,
  })

  return Array.isArray(data.tags) ? data.tags : []
}
