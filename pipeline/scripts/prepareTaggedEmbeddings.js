import { withDatabaseClient } from '../src/clients/database.js';
import {
  prepareMissingTaggedSeriesEmbeddings,
  prepareTaggedSeriesEmbeddings,
} from '../src/services/fredSeriesRepository.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

const missingOnly = process.argv.includes('--missing-only');

await withDatabaseClient(async (client) => {
  const beforeStats = await getFredSeriesTableStats(client);

  console.log(`Total FRED series: ${beforeStats.total_series}`);
  console.log(`Tagged FRED series: ${beforeStats.tagged_series}`);
  console.log(`Embedded FRED series before: ${beforeStats.embedded_series}`);
  console.log(`Missing only: ${missingOnly ? 'yes' : 'no'}`);

  const result = missingOnly
    ? await prepareMissingTaggedSeriesEmbeddings(client)
    : await prepareTaggedSeriesEmbeddings(client);
  const afterStats = await getFredSeriesTableStats(client);

  if (!missingOnly) {
    console.log(
      `Cleared untagged embeddings: ${result.clearedUntaggedEmbeddings.toLocaleString()}`,
    );
  }

  console.log(
    `Prepared tagged series for re-embedding: ${result.preparedTaggedSeries.toLocaleString()}`,
  );
  console.log(`Embedded FRED series after: ${afterStats.embedded_series}`);
});
