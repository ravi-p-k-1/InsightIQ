import { fredRequestsPerMinute } from '../src/clients/fred.js';
import { withDatabaseClient } from '../src/clients/database.js';
import { syncFredSeriesTags } from '../src/services/fredSeriesTags.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

function parseLimit() {
  const limitIndex = process.argv.indexOf('--limit');

  if (limitIndex === -1) {
    return 100;
  }

  const limit = Number.parseInt(process.argv[limitIndex + 1], 10);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('--limit must be a positive integer.');
  }

  return limit;
}

const limit = parseLimit();

console.log(`FRED request limit: ${fredRequestsPerMinute} requests per minute`);
console.log(`Tag sync limit: ${limit.toLocaleString()}`);

await withDatabaseClient(async (client) => {
  const { syncedCount } = await syncFredSeriesTags(client, { limit });
  const stats = await getFredSeriesTableStats(client);

  console.log(`Synced tags for ${syncedCount.toLocaleString()} FRED series.`);
  console.log(`Total FRED series in database: ${stats.total_series}`);
  console.log(`Tagged FRED series: ${stats.tagged_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log(`National series: ${stats.national_series}`);
  console.log(`State series: ${stats.state_series}`);
});
