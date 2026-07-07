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

const overallSummaryPrompt = `
You summarize a dashboard built from multiple FRED series.
Given a user's question and the retrieved FRED series with observations, return only JSON with this exact shape:
{
  "summary": "Three to five sentence plain-English overview of the combined data."
}

Rules:
- Ground the summary only in the supplied observations.
- Mention how the series relate to the user's question when the data supports it.
- Do not invent causes, forecasts, policy recommendations, or external context.
- If the series point in different directions, say that directly.
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

export async function getOverallInsightSummary(query, series) {
  const response = await getGeminiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `${overallSummaryPrompt}\n\nUser question: ${query}\n\nFRED data: ${JSON.stringify(
      series,
    )}`,
    config: {
      responseMimeType: 'application/json',
    },
  })

  const data = parseGeminiJson(response.text ?? '')

  if (typeof data.summary !== 'string') {
    throw new Error('Gemini returned an unexpected overall summary response format.')
  }

  return data.summary
}

export async function getInsightsForFredSeries(query, series) {
  const [summary, seriesWithInsights] = await Promise.all([
    getOverallInsightSummary(query, series),
    Promise.all(
      series.map(async (item) => ({
        ...item,
        insight: await getInsightForFredSeries(query, item),
      })),
    ),
  ])

  return {
    summary,
    series: seriesWithInsights,
  }
}
