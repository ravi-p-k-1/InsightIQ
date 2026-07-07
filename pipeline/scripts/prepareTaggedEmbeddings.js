import { withDatabaseClient } from '../src/clients/database.js';
import { prepareTaggedSeriesEmbeddings } from '../src/services/fredSeriesRepository.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

await withDatabaseClient(async (client) => {
  const beforeStats = await getFredSeriesTableStats(client);

  console.log(`Total FRED series: ${beforeStats.total_series}`);
  console.log(`Tagged FRED series: ${beforeStats.tagged_series}`);
  console.log(`Embedded FRED series before: ${beforeStats.embedded_series}`);

  const result = await prepareTaggedSeriesEmbeddings(client);
  const afterStats = await getFredSeriesTableStats(client);

  console.log(
    `Cleared untagged embeddings: ${result.clearedUntaggedEmbeddings.toLocaleString()}`,
  );
  console.log(
    `Prepared tagged series for re-embedding: ${result.preparedTaggedSeries.toLocaleString()}`,
  );
  console.log(`Embedded FRED series after: ${afterStats.embedded_series}`);
});
