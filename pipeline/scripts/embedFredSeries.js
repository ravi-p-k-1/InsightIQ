import { getConfiguredEmbeddingModel } from '../src/clients/embedding.js';
import { withDatabaseClient } from '../src/clients/database.js';
import { embedFredSeries } from '../src/services/fredSeriesEmbeddings.js';
import { getFredSeriesTableStats } from '../src/services/fredSeriesTable.js';

function parsePositiveIntegerOption(name, fallback) {
  const optionIndex = process.argv.indexOf(name);

  if (optionIndex === -1) {
    return fallback;
  }

  const value = Number.parseInt(process.argv[optionIndex + 1], 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

const limit = parsePositiveIntegerOption('--limit', 100);
const batchSize = parsePositiveIntegerOption('--batch-size', 25);

console.log(`Embedding model: ${getConfiguredEmbeddingModel()}`);
console.log(`Embedding limit: ${limit.toLocaleString()}`);
console.log(`Embedding batch size: ${batchSize.toLocaleString()}`);

await withDatabaseClient(async (client) => {
  const { embeddedCount } = await embedFredSeries(client, {
    limit,
    batchSize,
  });
  const stats = await getFredSeriesTableStats(client);

  console.log(`Embedded ${embeddedCount.toLocaleString()} FRED series.`);
  console.log(`Total FRED series in database: ${stats.total_series}`);
  console.log(`Embedded FRED series: ${stats.embedded_series}`);
  console.log(`National series: ${stats.national_series}`);
  console.log(`State series: ${stats.state_series}`);
});
