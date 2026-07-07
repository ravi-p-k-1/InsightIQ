import express from 'express'
import { getFredSeriesForQuery } from './services/vectorFred.js'
import { getInsightsForFredSeries } from './services/geminiInsights.js'
import { getFredSeriesWithObservations } from './services/fred.js'
import { normalizeSelectedSeries } from './utils/series.js'

const port = Number(process.env.PORT ?? 3001)
const app = express()

app.use(express.json())

app.use((request, response, next) => {
  response.header(
    'Access-Control-Allow-Origin',
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  )
  response.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  response.header('Access-Control-Allow-Headers', 'Content-Type')

  if (request.method === 'OPTIONS') {
    response.sendStatus(204)
    return
  }

  next()
})

app.get('/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.post('/api/series-ids', async (request, response) => {
  const query = request.body?.query?.trim()

  if (!query) {
    response.status(400).json({ error: 'Query is required.' })
    return
  }

  try {
    const series = await getFredSeriesForQuery(query)
    response.json({ series })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/insights', async (request, response) => {
  const query = request.body?.query?.trim()
  const selectedSeries = Array.isArray(request.body?.series)
    ? normalizeSelectedSeries(request.body.series)
    : []

  if (!query) {
    response.status(400).json({ error: 'Query is required.' })
    return
  }

  if (selectedSeries.length === 0) {
    response.status(400).json({
      error:
        'At least one valid FRED series is required. Series IDs must be 1 to 25 alphanumeric characters.',
    })
    return
  }

  try {
    const seriesWithObservations = await getFredSeriesWithObservations(selectedSeries)

    if (seriesWithObservations.length === 0) {
      response.status(404).json({
        error: 'None of the requested FRED series could be found.',
      })
      return
    }

    const insights = await getInsightsForFredSeries(query, seriesWithObservations)

    response.json({
      query,
      summary: insights.summary,
      series: insights.series,
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.use((request, response) => {
  response.status(404).json({ error: 'Not found' })
})

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})
