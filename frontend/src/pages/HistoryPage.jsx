import { Link } from 'react-router-dom'
import { getHistory } from '../services/history'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeStyle: 'short',
})

function HistoryPage() {
  const history = getHistory()

  return (
    <>
      <header className="dashboard__header">
        <h1>History</h1>
        <p>Open a saved result instead of calling the APIs again.</p>
      </header>

      {history.length > 0 ? (
        <div className="history-table__wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const createdAt = new Date(item.createdAt)

                return (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/history/${item.id}`}>{item.query}</Link>
                    </td>
                    <td>{dateFormatter.format(createdAt)}</td>
                    <td>{timeFormatter.format(createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">No saved queries yet.</p>
      )}
    </>
  )
}

export default HistoryPage
