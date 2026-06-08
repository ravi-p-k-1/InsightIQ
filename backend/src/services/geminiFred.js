import { getGeminiClient } from '../clients/gemini.js'
import { parseGeminiJson } from '../utils/gemini.js'

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

  return data.series
    .filter((item) => item?.seriesId)
    .map((item) => ({
      seriesId: String(item.seriesId),
      title: item.title ? String(item.title) : String(item.seriesId),
    }))
}
