import { useState } from 'react'
import ChartBox from './components/ChartBox'
import PromptSearchBar from './components/PromptSearchBar'
import { getFredSeriesForQuery, getInsightsForSeries } from './services/insights'

function App() {
  const [series, setSeries] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handlePromptSubmit(query) {
    setIsLoading(true)
    setError('')
    setSeries([])

    try {
      const selectedSeries = await getFredSeriesForQuery(query)
      const result = await getInsightsForSeries(query, selectedSeries)
      setSeries(result.series)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>Economic Insight Assistant</h1>
        <p>Enter a query to generate dashboard-ready economic insight modules.</p>
      </header>

      <PromptSearchBar isLoading={isLoading} onSubmit={handlePromptSubmit} />

      {error && <p className="dashboard__error">{error}</p>}

      {series.length > 0 && (
        <section className="chart-grid" aria-label="Generated insight modules">
          {series.map((card) => (
            <ChartBox
              key={card.seriesId ?? card.title}
              title={card.title}
              seriesId={card.seriesId}
              units={card.units}
              observations={card.observations}
              insight={card.insight}
            />
          ))}
        </section>
      )}
    </main>
  )
}

export default App
