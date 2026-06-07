import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

const systemPrompt = `
You help select Federal Reserve Economic Data (FRED) series IDs for economic charting.
Given a user's question, return only JSON with this exact shape:
{
  "series": [
    {
      "seriesId": "FRED_SERIES_ID",
      "title": "Human readable chart title",
      "reason": "Short reason this series answers the query"
    }
  ]
}

Rules:
- Return 1 to 4 highly relevant FRED series.
- Use real, commonly used FRED series IDs when possible.
- Prefer broad official indicators over obscure series.
- Do not include markdown, comments, or extra text.
`

function parseGeminiJson(text) {
  const trimmed = text.trim()
  const jsonText = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  return JSON.parse(jsonText)
}

export async function getFredSeriesForQuery(query) {
  if (!ai) {
    throw new Error('Missing VITE_GEMINI_API_KEY in your local environment.')
  }

  const response = await ai.models.generateContent({
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
      reason: item.reason ? String(item.reason) : 'Relevant FRED series',
    }))
}
