import { getGeminiClient } from '../clients/gemini.js'
import { parseGeminiJson } from '../utils/gemini.js'

const systemPrompt = `
You explain economic data for a dashboard.
Given a user's question and one FRED series with observations, return only JSON with this exact shape:
{
  "summary": "Two to four sentence plain-English explanation.",
  "keyTakeaways": ["Short takeaway", "Short takeaway"]
}

Rules:
- Ground the explanation only in the supplied observations.
- Mention direction, magnitude, and timing when the data supports it.
- Do not invent causes, forecasts, or policy claims.
- Do not include markdown, comments, or extra text.
`

export async function getInsightForFredSeries(query, series) {
  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${systemPrompt}\n\nUser question: ${query}\n\nFRED data: ${JSON.stringify(
      series,
    )}`,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const data = parseGeminiJson(response.text ?? '')

  if (typeof data.summary !== 'string' || !Array.isArray(data.keyTakeaways)) {
    throw new Error('Gemini returned an unexpected insight response format.')
  }

  return {
    summary: data.summary,
    keyTakeaways: data.keyTakeaways.map(String).filter(Boolean),
  }
}

export async function getInsightsForFredSeries(query, series) {
  return Promise.all(
    series.map(async (item) => ({
      ...item,
      insight: await getInsightForFredSeries(query, item),
    })),
  )
}
