const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export async function getFredSeriesForQuery(query) {
  const response = await fetch(`${apiBaseUrl}/api/series-ids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Unable to fetch series IDs.')
  }

  if (!Array.isArray(data.series)) {
    throw new Error('Backend returned an unexpected series response format.')
  }

  return data.series
    .filter((item) => item?.seriesId)
    .map((item) => ({
      seriesId: String(item.seriesId),
      title: item.title ? String(item.title) : String(item.seriesId),
    }))
}

export async function getInsightsForSeries(query, series) {
  const response = await fetch(`${apiBaseUrl}/api/insights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, series }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Unable to generate insights.')
  }

  if (
    typeof data.summary !== 'string' ||
    !Array.isArray(data.series) ||
    data.series.some(
      (item) =>
        !Array.isArray(item.observations) ||
        typeof item.insight?.summary !== 'string',
    )
  ) {
    throw new Error('Backend returned an unexpected response format.')
  }

  return data
}
