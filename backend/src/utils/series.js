export function normalizeSelectedSeries(series) {
  return series
    .filter((item) => item?.seriesId)
    .map((item) => ({
      seriesId: String(item.seriesId),
      title: item.title ? String(item.title) : String(item.seriesId),
    }))
}
