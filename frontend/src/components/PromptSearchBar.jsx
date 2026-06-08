function PromptSearchBar({ isLoading, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const query = formData.get('query')?.trim()

    if (query) {
      onSubmit(query)
    }
  }

  return (
    <form
      className="prompt-search"
      aria-label="Economic insight search"
      onSubmit={handleSubmit}
    >
      <input
        name="query"
        type="search"
        placeholder="Ask about inflation, GDP, jobs, markets, or regional trends"
        aria-label="Economic insight query"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
    </form>
  )
}

export default PromptSearchBar
