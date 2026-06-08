const historyKey = 'economicInsightHistory'
const historyLimit = 10

function readHistory() {
  try {
    const value = localStorage.getItem(historyKey)
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

function writeHistory(history) {
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, historyLimit)))
}

export function getHistory() {
  return readHistory()
}

export function getHistoryItem(id) {
  return readHistory().find((item) => item.id === id) ?? null
}

export function saveHistoryItem(query, result) {
  const item = {
    id: crypto.randomUUID(),
    query,
    createdAt: new Date().toISOString(),
    result,
  }
  const existingHistory = readHistory().filter(
    (historyItem) => historyItem.query.trim().toLowerCase() !== query.trim().toLowerCase(),
  )

  writeHistory([item, ...existingHistory])
  return item
}
