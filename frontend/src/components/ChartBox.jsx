function formatValue(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function ChartBox({
  title,
  seriesId,
  units,
  unitsShort,
  observations = [],
  insight,
}) {
  const latestObservation = observations.at(-1)
  const recentObservations = observations.slice(-5).reverse()
  const displayUnits = unitsShort || units

  return (
    <section className="chart-box">
      <div className="chart-box__header">
        <h2>{title}</h2>
        <span>{seriesId}</span>
      </div>
      <div className="chart-box__canvas" aria-label={`${title} latest value`}>
        {latestObservation ? (
          <div>
            <span>{latestObservation.date}</span>
            <strong>{formatValue(latestObservation.value)}</strong>
            {displayUnits && <small>{displayUnits}</small>}
          </div>
        ) : (
          <span>No observations returned</span>
        )}
      </div>
      {recentObservations.length > 0 && (
        <table className="chart-box__table">
          <thead>
            <tr>
              <th>Date</th>
              <th>{displayUnits ? `Value (${displayUnits})` : 'Value'}</th>
            </tr>
          </thead>
          <tbody>
            {recentObservations.map((observation) => (
              <tr key={observation.date}>
                <td>{observation.date}</td>
                <td>{formatValue(observation.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {insight && (
        <div className="chart-box__insight">
          <p>{insight.summary}</p>
          {insight.keyTakeaways?.length > 0 && (
            <ul>
              {insight.keyTakeaways.map((takeaway) => (
                <li key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export default ChartBox
