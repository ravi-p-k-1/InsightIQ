import { useState } from 'react'
import ChartBox from './components/ChartBox'
import PromptSearchBar from './components/PromptSearchBar'
import { getFredSeriesForQuery } from './services/geminiFred'

function App() {
  const [series, setSeries] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handlePromptSubmit(query) {
    setIsLoading(true)
    setError('')
    setSeries([])

    try {
      const fredSeries = await getFredSeriesForQuery(query)
      setSeries(
        fredSeries.map((item) => ({
          title: item.title,
          description: item.reason,
          seriesId: item.seriesId,
        })),
      )
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
              description={
                card.seriesId
                  ? `${card.seriesId}: ${card.description}`
                  : card.description
              }
            />
          ))}
        </section>
      )}
    </main>
  )
}

export default App
