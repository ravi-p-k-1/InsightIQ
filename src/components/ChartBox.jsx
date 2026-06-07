function ChartBox({ title, description }) {
  return (
    <section className="chart-box">
      <div className="chart-box__header">
        <h2>{title}</h2>
      </div>
      <div className="chart-box__canvas" aria-label={`${title} chart area`}>
        <span>Chart area</span>
      </div>
      <p>{description}</p>
    </section>
  )
}

export default ChartBox
