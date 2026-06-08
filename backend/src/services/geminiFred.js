import { getGeminiClient } from '../clients/gemini.js'
import { parseGeminiJson } from '../utils/gemini.js'
import { normalizeSelectedSeries } from '../utils/series.js'

const systemPrompt = `
You help select Federal Reserve Economic Data (FRED) series IDs for economic charting.
Given a user's question, return only JSON with this exact shape:
{
  "series": [
    {
      "seriesId": "FRED_SERIES_ID",
      "title": "Human readable chart title"
    }
  ]
}

Rules:
- Return 1 to 4 highly relevant FRED series.
- Use real, commonly used FRED series IDs when possible.
- seriesId must be only the exact FRED series ID with 1 to 25 alphanumeric characters.
- Do not include spaces, punctuation, labels, descriptions, or multiple IDs in one seriesId value.
- Prefer broad official indicators over obscure series.
- Do not include markdown, comments, or extra text.
`

export async function getFredSeriesForQuery(query) {
  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${systemPrompt}\n\nUser question: ${query}`,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const data = parseGeminiJson(response.text ?? '')

  if (!Array.isArray(data.series)) {
    throw new Error('Gemini returned an unexpected response format.')
  }

  const series = normalizeSelectedSeries(data.series)

  if (series.length === 0) {
    throw new Error('Gemini did not return any valid FRED series IDs.')
  }

  return series
}
