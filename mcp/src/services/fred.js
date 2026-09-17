import { fetchFredJson } from '../clients/fred.js'
import {
  normalizeObservation,
  normalizeSeriesMetadata,
} from '../utils/fred.js'

const recentObservationLimit = 24
const defaultFrequency = 'a'

export async function getFredSeriesMetadata(seriesId) {
  let data

  try {
    data = await fetchFredJson('series', { series_id: seriesId })
  } catch (error) {
    throw new Error(`Unable to fetch FRED metadata for ${seriesId}: ${error.message}`)
  }

  if (!Array.isArray(data.seriess) || !data.seriess[0]) {
    throw new Error(`FRED returned missing metadata for ${seriesId}.`)
  }

  return normalizeSeriesMetadata(data.seriess[0])
}

export async function getFredObservations(seriesId, options = {}) {
  let data

  try {
    data = await fetchFredJson('series/observations', {
      series_id: seriesId,
      frequency: options.frequency ?? defaultFrequency,
      sort_order: 'desc',
      limit: options.limit ?? recentObservationLimit,
    })
  } catch (error) {
    throw new Error(`Unable to fetch FRED series ${seriesId}: ${error.message}`)
  }

  if (!Array.isArray(data.observations)) {
    throw new Error(`FRED returned an unexpected response for ${seriesId}.`)
  }

  return data.observations
    .map(normalizeObservation)
    .filter(Boolean)
    .reverse()
}

export async function getFredSeriesWithObservations(series) {
  const results = await Promise.allSettled(
    series.map(async (item) => {
      const [metadata, observations] = await Promise.all([
        getFredSeriesMetadata(item.seriesId),
        getFredObservations(item.seriesId),
      ])

      return {
        ...item,
        title: metadata.title ?? item.title,
        units: metadata.units,
        observations,
      }
    }),
  )

  return results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter((item) => item.observations.length > 0)
}
