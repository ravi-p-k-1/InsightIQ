function OverallSummary({ summary }) {
  if (!summary) {
    return null
  }

  return (
    <section className="insight-panel" aria-label="Overall summary">
      <h2>Overall Summary</h2>
      <p>{summary}</p>
    </section>
  )
}

export default OverallSummary
