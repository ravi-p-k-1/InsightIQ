export function parseGeminiJson(text) {
  const trimmed = text.trim()
  const jsonText = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  return JSON.parse(jsonText)
}
