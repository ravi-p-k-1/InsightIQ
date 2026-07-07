import { Link, useParams } from 'react-router-dom'
import OverallSummary from '../components/OverallSummary'
import ResultsGrid from '../components/ResultsGrid'
import { getHistoryItem } from '../services/history'

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function HistoryDetailPage() {
  const { id } = useParams()
  const historyItem = getHistoryItem(id)

  if (!historyItem) {
    return (
      <>
        <header className="dashboard__header">
          <h1>Saved Result</h1>
          <p>This saved query could not be found.</p>
        </header>
        <Link className="text-link" to="/history">
          Back to history
        </Link>
      </>
    )
  }

  return (
    <>
      <header className="dashboard__header">
        <h1>{historyItem.query}</h1>
        <p>Saved {dateTimeFormatter.format(new Date(historyItem.createdAt))}</p>
      </header>

      <OverallSummary summary={historyItem.result.summary} />
      <ResultsGrid series={historyItem.result.series} />
    </>
  )
}

export default HistoryDetailPage
