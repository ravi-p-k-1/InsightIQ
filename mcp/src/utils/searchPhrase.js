const fillerWords = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'doing',
  'have', 'has', 'had', 'having',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'what', 'how', 'why', 'when', 'where', 'who', 'whom', 'which',
  'and', 'or', 'but', 'if', 'so', 'because', 'than', 'then',
  'in', 'on', 'at', 'of', 'for', 'with', 'to', 'from', 'about', 'over', 'into', 'out', 'up', 'down', 'by', 'as',
  'happening', 'changing', 'change', 'trend', 'trends', 'trending',
  'situation', 'current', 'currently', 'nationally', 'going',
  'fast', 'quickly', 'slow', 'slowly', 'growing', 'rising', 'falling',
  'increasing', 'decreasing', 'improving', 'worsening', 'recently', 'lately',
  'compare', 'comparing', 'suggest', 'suggests', 'indicate', 'indicates',
  'monitor', 'potential',
  'united', 'states', 'usa', 'america', 'american', 'nation', 'national',
])

// FRED's full-text search effectively requires every remaining term to match,
// so a full conversational question (lots of function/filler words) reliably
// returns zero results. Reducing it to the content-bearing terms fixes that
// without needing an LLM call in the retrieval path.
export function toFredSearchPhrase(query) {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const contentWords = words.filter((word) => !fillerWords.has(word))
  const phrase = (contentWords.length > 0 ? contentWords : words).join(' ')

  return phrase || query.trim()
}
