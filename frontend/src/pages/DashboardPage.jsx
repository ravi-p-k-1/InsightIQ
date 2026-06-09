import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PromptSearchBar from '../components/PromptSearchBar'
import ResultsGrid from '../components/ResultsGrid'
import { getFredSeriesForQuery, getInsightsForSeries } from '../services/insights'
import { saveHistoryItem } from '../services/history'

function DashboardPage() {
  const [series, setSeries] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  async function handlePromptSubmit(query) {
    setIsLoading(true)
    setError('')
    setSeries([])

    try {
      const selectedSeries = await getFredSeriesForQuery(query)
      const result = await getInsightsForSeries(query, selectedSeries)
      setSeries(result.series)
      const historyItem = saveHistoryItem(query, result)
      navigate(`/history/${historyItem.id}`)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="dashboard__header">
        <h1>InsightIQ: Economy Insight Assistant</h1>
        <p>Enter a query to generate dashboard-ready economic insight modules.</p>
      </header>

      <PromptSearchBar isLoading={isLoading} onSubmit={handlePromptSubmit} />

      {error && <p className="dashboard__error">{error}</p>}

      <ResultsGrid series={series} />
    </>
  )
}

export default DashboardPage
