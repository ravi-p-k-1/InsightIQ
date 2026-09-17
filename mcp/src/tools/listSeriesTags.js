import { z } from 'zod'
import { getSeriesTagsForQuery } from '../services/fredTags.js'

export const name = 'list_series_tags'

export const config = {
  title: 'List series tags',
  description:
    'Discover the FRED tags that actually exist among series matching a topic, and how many series ' +
    'each tag covers. Use this before narrowing search_economic_series or get_economic_data with ' +
    'tags/excludeTags — FRED tag names are a controlled vocabulary (geography codes, "sa"/"nsa" for ' +
    'seasonal adjustment, frequency like "monthly") that usually cannot be guessed reliably, so guessing ' +
    'a wrong tag name silently returns zero results instead of erroring. Common tag groups include ' +
    'geography (e.g. "usa", "state", state postal codes like "tx"), seasonal adjustment ("sa", "nsa"), ' +
    'and frequency ("monthly", "quarterly", "annual").',
  inputSchema: {
    query: z.string().min(1).describe('A concise topic phrase, e.g. "unemployment rate".'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe('Maximum number of tags to return, ordered by how many series they cover. Defaults to 20.'),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
}

export async function handler({ query, limit }) {
  const tags = await getSeriesTagsForQuery(query, { limit })

  if (tags.length === 0) {
    return {
      content: [{ type: 'text', text: 'No tags were found for this query.' }],
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ tags }, null, 2) }],
  }
}
