import { withDatabaseClient } from '../src/clients/database.js';
import {
  createFredSeriesEmbeddingIndex,
  getFredSeriesIndexStats,
  getFredSeriesTableStats,
} from '../src/services/fredSeriesTable.js';

await withDatabaseClient(async (client) => {
  const stats = await getFredSeriesTableStats(client);

  console.log(`Total FRED series: ${stats.total_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log('Creating fred_series embedding HNSW index...');

  await createFredSeriesEmbeddingIndex(client);

  const indexes = await getFredSeriesIndexStats(client);
  const embeddingIndex = indexes.find(
    (index) => index.indexname === 'fred_series_embedding_hnsw_idx',
  );

  if (!embeddingIndex) {
    throw new Error('fred_series_embedding_hnsw_idx was not created.');
  }

  console.log('Created fred_series_embedding_hnsw_idx.');
  console.log(embeddingIndex.indexdef);
});
