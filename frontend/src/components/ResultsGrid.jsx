import ChartBox from './ChartBox'

function ResultsGrid({ series }) {
  if (!series?.length) {
    return null
  }

  return (
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
  )
}

export default ResultsGrid
