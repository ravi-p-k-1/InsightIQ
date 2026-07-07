import { embedText } from '../clients/embedding.js';
import { searchFredSeriesByEmbedding } from './fredSeriesRepository.js';

export async function searchFredSeries(client, query, options = {}) {
  const limit = options.limit ?? 10;
  const embedding = await embedText(query);

  return searchFredSeriesByEmbedding(client, embedding, limit);
}
