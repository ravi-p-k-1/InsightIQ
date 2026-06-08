export function normalizeObservation(observation) {
  const value = Number(observation.value)

  if (!Number.isFinite(value)) {
    return null
  }

  return {
    date: observation.date,
    year: observation.date.slice(0, 4),
    value,
  }
}

export function normalizeSeriesMetadata(series) {
  return {
    title: series.title ? String(series.title) : undefined,
    units: series.units ? String(series.units) : '',
  }
}
