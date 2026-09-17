import { z } from 'zod'
import { getFredSeriesForQueries } from '../services/fredSearch.js'
import { getFredSeriesWithObservations } from '../services/fred.js'

export const name = 'get_economic_data'

export const config = {
  title: 'Get economic data for a question',
  description:
    'Convenience tool that chains search_economic_series and get_series_observations in one call: ' +
    'searches FRED for series relevant to a question, then fetches their observations. ' +
    'Returns raw retrieved data only (series, units, observations) — you (the calling agent) should ' +
    'analyze this data yourself and write the explanation, this tool does not generate one. ' +
    'For better recall on vague questions, optionally pass searchQueries with 1-3 concise FRED-style ' +
    'keyword phrases; otherwise the question itself is used as the search text.',
  inputSchema: {
    question: z.string().min(1).describe('The natural-language economic question being asked.'),
    searchQueries: z
      .array(z.string().min(1))
      .min(1)
      .max(3)
      .optional()
      .describe(
        'Optional: 1-3 concise search phrases to use instead of the raw question, e.g. ' +
          '["inflation", "consumer price index"].',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe('Maximum number of series to search for and fetch data on. Defaults to 4.'),
    tags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Optional FRED tag names that returned series must ALL have (e.g. ["usa", "state"] to force ' +
          'state-level series). Use list_series_tags first to find valid tag names for your topic — an ' +
          'unrecognized tag silently returns zero results instead of erroring.',
      ),
    excludeTags: z
      .array(z.string().min(1))
      .optional()
      .describe(
        'Optional FRED tag names that returned series must NOT have (e.g. ["nsa"] to exclude ' +
          'seasonally-unadjusted series).',
      ),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
}

export async function handler({ question, searchQueries, limit, tags, excludeTags }) {
  const series = await getFredSeriesForQueries(
    searchQueries?.length ? searchQueries : [question],
    { limit, tagNames: tags, excludeTagNames: excludeTags },
  )

  if (series.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No matching FRED series were found for this question. Try rephrasing it or supplying searchQueries.',
        },
      ],
    }
  }

  const seriesWithObservations = await getFredSeriesWithObservations(series)

  return {
    content: [{ type: 'text', text: JSON.stringify({ series: seriesWithObservations }, null, 2) }],
  }
}
