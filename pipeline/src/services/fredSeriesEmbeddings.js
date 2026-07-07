import { embedText } from '../clients/embedding.js';
import {
  getFredSeriesNeedingEmbeddings,
  updateFredSeriesEmbedding,
} from './fredSeriesRepository.js';

const defaultBatchSize = 25;

export async function embedFredSeries(client, options = {}) {
  const limit = options.limit ?? defaultBatchSize;
  const batchSize = options.batchSize ?? defaultBatchSize;
  const taggedOnly = options.taggedOnly ?? false;
  let embeddedCount = 0;

  while (embeddedCount < limit) {
    const remaining = limit - embeddedCount;
    const rows = await getFredSeriesNeedingEmbeddings(
      client,
      Math.min(batchSize, remaining),
      { taggedOnly },
    );

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const embedding = await embedText(row.embedding_text);
      await updateFredSeriesEmbedding(client, row.series_id, embedding);
      embeddedCount += 1;
    }

    console.log(`Embedded ${embeddedCount.toLocaleString()} FRED series...`);
  }

  return { embeddedCount };
}
