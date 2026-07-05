import { fredRequestsPerMinute } from '../src/clients/fred.js';
import { withDatabaseClient } from '../src/clients/database.js';
import {
  getFredScopeCounts,
  syncFredCatalogToDatabase,
  verifyFredGeographyTypeTags,
} from '../src/services/fredCatalog.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

function parseLimit() {
  const limitIndex = process.argv.indexOf('--limit');

  if (limitIndex === -1) {
    return null;
  }

  const limit = Number.parseInt(process.argv[limitIndex + 1], 10);

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('--limit must be a positive integer.');
  }

  return limit;
}

const limit = parseLimit();

console.log(`FRED request limit: ${fredRequestsPerMinute} requests per minute`);

await verifyFredGeographyTypeTags();
const reportedScopeCounts = await getFredScopeCounts();

console.log('FRED reported series counts:');
for (const [scope, count] of Object.entries(reportedScopeCounts)) {
  console.log(`- ${scope}: ${count.toLocaleString()}`);
}

await withDatabaseClient(async (client) => {
  const { fetchedScopeCounts } = await syncFredCatalogToDatabase(client, {
    limit,
  });
  const stats = await getFredSeriesTableStats(client);

  console.log('FRED synced series counts:');
  for (const [scope, count] of Object.entries(fetchedScopeCounts)) {
    console.log(`- ${scope}: ${count.toLocaleString()}`);
  }

  console.log(`Total FRED series in database: ${stats.total_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log(`National series: ${stats.national_series}`);
  console.log(`State series: ${stats.state_series}`);
});
