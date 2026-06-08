const fredSeriesIdPattern = /^[A-Za-z0-9]{1,25}$/

export function isValidFredSeriesId(seriesId) {
  return fredSeriesIdPattern.test(seriesId)
}

export function normalizeSelectedSeries(series) {
  return series
    .filter((item) => item?.seriesId)
    .map((item) => ({
      seriesId: String(item.seriesId),
      title: item.title ? String(item.title) : String(item.seriesId),
    }))
    .filter((item) => isValidFredSeriesId(item.seriesId))
}
