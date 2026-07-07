import { fetchFredJson } from '../clients/fred.js';
import {
  getFredSeriesNeedingTags,
  updateFredSeriesTags,
} from './fredSeriesRepository.js';
import { setupFredSeriesTable } from './fredSeriesTable.js';

const defaultTagSyncLimit = 100;
const defaultTagSyncConcurrency = 5;
const maxTagSyncConcurrency = 25;
const progressLogInterval = 25;

function normalizeFredTag(tag) {
  return {
    name: String(tag.name),
    groupId: String(tag.group_id),
    notes: tag.notes ? String(tag.notes) : '',
    popularity: Number(tag.popularity) || 0,
    seriesCount: Number(tag.series_count) || 0,
  };
}

async function fetchSeriesTags(seriesId) {
  const data = await fetchFredJson('series/tags', {
    series_id: seriesId,
  });

  return (data.tags ?? []).map(normalizeFredTag);
}

function normalizeConcurrency(value) {
  const concurrency = value ?? defaultTagSyncConcurrency;

  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new Error('Tag sync concurrency must be a positive integer.');
  }

  return Math.min(concurrency, maxTagSyncConcurrency);
}

async function processRowsWithConcurrency(rows, concurrency, handler) {
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < rows.length) {
      const row = rows[nextIndex];
      nextIndex += 1;
      await handler(row);
    }
  }

  const workerCount = Math.min(concurrency, rows.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export async function syncFredSeriesTags(client, options = {}) {
  const limit = options.limit ?? defaultTagSyncLimit;
  const concurrency = normalizeConcurrency(options.concurrency);
  let processedCount = 0;
  let syncedCount = 0;
  let failedCount = 0;
  let updateQueue = Promise.resolve();
  const startedAt = Date.now();

  await setupFredSeriesTable(client);

  while (processedCount < limit) {
    const remaining = limit - processedCount;
    const batchSize = Math.min(remaining, Math.max(25, concurrency * 25));
    const rows = await getFredSeriesNeedingTags(client, batchSize);

    if (rows.length === 0) {
      break;
    }

    await processRowsWithConcurrency(rows, concurrency, async (row) => {
      try {
        const tags = await fetchSeriesTags(row.series_id);

        updateQueue = updateQueue.then(() => (
          updateFredSeriesTags(client, row.series_id, tags)
        ));
        await updateQueue;

        syncedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.warn(`Failed to sync tags for ${row.series_id}: ${error.message}`);
      } finally {
        processedCount += 1;
      }

      if (processedCount === 1 || processedCount % progressLogInterval === 0) {
        const elapsedSeconds = (Date.now() - startedAt) / 1000;
        const seriesPerMinute = elapsedSeconds > 0
          ? processedCount / (elapsedSeconds / 60)
          : 0;
        const remaining = limit - processedCount;
        const etaMinutes = seriesPerMinute > 0
          ? remaining / seriesPerMinute
          : 0;
        const percentComplete = (processedCount / limit) * 100;

        console.log(
          `Processed ${processedCount.toLocaleString()}/${limit.toLocaleString()} series (${percentComplete.toFixed(1)}%) | synced ${syncedCount.toLocaleString()} | ${seriesPerMinute.toFixed(1)} series/min | ETA ${etaMinutes.toFixed(1)} min | failures ${failedCount.toLocaleString()}`,
        );
      }
    });
  }

  return { syncedCount, failedCount, concurrency };
}
