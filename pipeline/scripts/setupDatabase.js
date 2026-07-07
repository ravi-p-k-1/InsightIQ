import { withDatabaseClient } from '../src/clients/database.js';
import {
  getFredSeriesTableStats,
  setupFredSeriesTable,
} from '../src/services/fredSeriesTable.js';

await withDatabaseClient(async (client) => {
  await setupFredSeriesTable(client);
  const stats = await getFredSeriesTableStats(client);

  console.log('Database schema is ready.');
  console.log(`Total FRED series: ${stats.total_series}`);
  console.log(`Tagged FRED series: ${stats.tagged_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log(`National series: ${stats.national_series}`);
  console.log(`State series: ${stats.state_series}`);
});
