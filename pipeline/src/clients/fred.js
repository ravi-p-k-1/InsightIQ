import {
  defaultFredRequestsPerMinute,
  fredApiBaseUrl,
  fredMaxAttempts,
} from '../config/fred.js'
import { getPositiveIntegerEnv, getRequiredEnv } from '../utils/env.js'
import { createRateLimiter, wait } from '../utils/rateLimiter.js'

export const fredRequestsPerMinute = getPositiveIntegerEnv(
  'FRED_REQUESTS_PER_MINUTE',
  defaultFredRequestsPerMinute,
)

const waitForRequestSlot = createRateLimiter(fredRequestsPerMinute)

export async function fetchFredJson(endpoint, parameters) {
  const url = new URL(`${fredApiBaseUrl}/${endpoint}`)
  url.searchParams.set('api_key', getRequiredEnv('FRED_API_KEY'))
  url.searchParams.set('file_type', 'json')

  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, String(value))
  }

  for (let attempt = 1; attempt <= fredMaxAttempts; attempt += 1) {
    try {
      await waitForRequestSlot()
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
      if (attempt === fredMaxAttempts || error.retryable === false) {
        throw error
      }

      const delay = 1000 * 2 ** (attempt - 1)
      console.warn(`FRED request failed. Retrying in ${delay}ms...`)
      await wait(delay)
    }
  }

  throw new Error('FRED request failed after all retry attempts.')
}
