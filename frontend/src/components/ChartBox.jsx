import LineChart from './LineChart'

function formatValue(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function ChartBox({
  title,
  seriesId,
  units,
  observations = [],
  insight,
}) {
  const latestObservation = observations.at(-1)
  const displayUnits = units

  return (
    <section className="chart-box">
      <div className="chart-box__header">
        <h2>{title}</h2>
        <span>{seriesId}</span>
      </div>
      <div className="chart-box__canvas" aria-label={`${title} latest value`}>
        <LineChart
          data={observations}
          units={displayUnits}
          ariaLabel={`${title} chart`}
        />
      </div>
      {latestObservation && (
        <p className="chart-box__latest">
          Latest: {latestObservation.year} - {formatValue(latestObservation.value)}
          {displayUnits ? ` ${displayUnits}` : ''}
        </p>
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
