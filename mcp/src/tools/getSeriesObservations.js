import { z } from 'zod'
import { getFredSeriesWithObservations } from '../services/fred.js'
import { normalizeSelectedSeries } from '../utils/series.js'

export const name = 'get_series_observations'

export const config = {
  title: 'Get series observations',
  description:
    'Fetch historical annual observations and units for specific real FRED series IDs. ' +
    'Returns raw retrieved data only — it does not generate any explanation or analysis. ' +
    'Use search_economic_series first to find real series IDs, then interpret the returned ' +
    'observations yourself to answer the user\'s question.',
  inputSchema: {
    series: z
      .array(
        z.object({
          seriesId: z.string().min(1).describe('A real FRED series ID, e.g. "CPIAUCSL".'),
          title: z.string().optional(),
        }),
      )
      .min(1)
      .describe('FRED series to fetch, typically the output of search_economic_series.'),
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
  },
}

export async function handler({ series }) {
  const selectedSeries = normalizeSelectedSeries(series)

  if (selectedSeries.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No valid FRED series IDs were provided. Series IDs must be 1 to 25 alphanumeric characters.',
        },
      ],
      isError: true,
    }
  }

  const seriesWithObservations = await getFredSeriesWithObservations(selectedSeries)

  if (seriesWithObservations.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'None of the given FRED series returned usable annual observations.',
        },
      ],
      isError: true,
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ series: seriesWithObservations }, null, 2) }],
  }
}
