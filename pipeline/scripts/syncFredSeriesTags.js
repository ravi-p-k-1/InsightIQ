import { fredRequestsPerMinute } from '../src/clients/fred.js';
import { withDatabaseClient } from '../src/clients/database.js';
import { syncFredSeriesTags } from '../src/services/fredSeriesTags.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

function parsePositiveIntegerOption(name, defaultValue) {
  const optionIndex = process.argv.indexOf(name);

  if (optionIndex === -1) {
    return defaultValue;
  }

  const value = Number.parseInt(process.argv[optionIndex + 1], 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

const limit = parsePositiveIntegerOption('--limit', 100);
const concurrency = parsePositiveIntegerOption('--concurrency', 5);

console.log(`FRED request limit: ${fredRequestsPerMinute} requests per minute`);
console.log(`Tag sync limit: ${limit.toLocaleString()}`);
console.log(`Tag sync concurrency: ${concurrency.toLocaleString()}`);

await withDatabaseClient(async (client) => {
  const { syncedCount, failedCount } = await syncFredSeriesTags(client, {
    limit,
    concurrency,
  });
  const stats = await getFredSeriesTableStats(client);

  console.log(`Synced tags for ${syncedCount.toLocaleString()} FRED series.`);
  console.log(`Failed tag syncs: ${failedCount.toLocaleString()}`);
  console.log(`Total FRED series in database: ${stats.total_series}`);
  console.log(`Tagged FRED series: ${stats.tagged_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log(`National series: ${stats.national_series}`);
  console.log(`State series: ${stats.state_series}`);
});
