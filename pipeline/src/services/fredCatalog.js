import {
  fredCatalogScopes,
  fredPageSize,
} from '../config/fred.js'
import { fetchFredJson } from '../clients/fred.js'

async function fetchScopePage(scope, offset, limit = fredPageSize) {
  return fetchFredJson('tags/series', {
    tag_names: scope.tags.join(';'),
    limit,
    offset,
    order_by: 'series_id',
    sort_order: 'asc',
  })
}

function normalizeSeries(series, scopeId) {
  return {
    seriesId: String(series.id),
    scopes: [scopeId],
    title: series.title ? String(series.title) : '',
    notes: series.notes ? String(series.notes) : '',
    frequency: series.frequency ? String(series.frequency) : '',
    frequencyShort: series.frequency_short ? String(series.frequency_short) : '',
    units: series.units ? String(series.units) : '',
    unitsShort: series.units_short ? String(series.units_short) : '',
    seasonalAdjustment: series.seasonal_adjustment
      ? String(series.seasonal_adjustment)
      : '',
    seasonalAdjustmentShort: series.seasonal_adjustment_short
      ? String(series.seasonal_adjustment_short)
      : '',
    observationStart: series.observation_start
      ? String(series.observation_start)
      : '',
    observationEnd: series.observation_end
      ? String(series.observation_end)
      : '',
    lastUpdated: series.last_updated ? String(series.last_updated) : '',
    popularity: Number(series.popularity) || 0,
    groupPopularity: Number(series.group_popularity) || 0,
  }
}

export async function verifyFredGeographyTypeTags() {
  const data = await fetchFredJson('tags', {
    tag_group_id: 'geot',
    limit: 1000,
    order_by: 'name',
    sort_order: 'asc',
  })
  const availableTags = new Set((data.tags ?? []).map((tag) => tag.name))
  const requiredTags = fredCatalogScopes.map((scope) => scope.tags[1])
  const missingTags = requiredTags.filter((tag) => !availableTags.has(tag))

  if (missingTags.length > 0) {
    throw new Error(
      `FRED geography type tags are missing: ${missingTags.join(', ')}.`,
    )
  }
}

export async function getFredScopeCounts() {
  const counts = {}

  for (const scope of fredCatalogScopes) {
    const data = await fetchScopePage(scope, 0, 1)
    counts[scope.id] = Number(data.count) || 0
  }

  return counts
}

async function fetchScope(scope, seriesById) {
  let offset = 0
  let expectedCount = null
  let fetchedCount = 0

  while (expectedCount === null || offset < expectedCount) {
    const data = await fetchScopePage(scope, offset)
    const page = Array.isArray(data.seriess) ? data.seriess : []
    expectedCount = Number(data.count) || 0

    for (const series of page) {
      const normalized = normalizeSeries(series, scope.id)
      const existing = seriesById.get(normalized.seriesId)

      if (existing) {
        existing.scopes = [...new Set([...existing.scopes, scope.id])]
      } else {
        seriesById.set(normalized.seriesId, normalized)
      }
    }

    offset += page.length
    fetchedCount += page.length
    console.log(
      `${scope.id}: fetched ${Math.min(offset, expectedCount)}/${expectedCount}`,
    )

    if (page.length === 0) {
      if (offset < expectedCount) {
        console.warn(
          `${scope.id}: FRED returned no more rows after ${offset}, although it reported ${expectedCount}.`,
        )
      }
      break
    }
  }

  return fetchedCount
}

export async function fetchFredCatalog() {
  const seriesById = new Map()
  const fetchedScopeCounts = {}

  for (const scope of fredCatalogScopes) {
    fetchedScopeCounts[scope.id] = await fetchScope(scope, seriesById)
  }

  return {
    seriesById,
    fetchedScopeCounts,
  }
}
