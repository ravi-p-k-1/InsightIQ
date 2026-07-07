import { fetchFredJson } from '../clients/fred.js';
import {
  getFredSeriesNeedingTags,
  updateFredSeriesTags,
} from './fredSeriesRepository.js';
import { setupFredSeriesTable } from './fredSeriesTable.js';

const defaultTagSyncLimit = 100;
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

export async function syncFredSeriesTags(client, options = {}) {
  const limit = options.limit ?? defaultTagSyncLimit;
  let syncedCount = 0;
  const startedAt = Date.now();

  await setupFredSeriesTable(client);

  while (syncedCount < limit) {
    const remaining = limit - syncedCount;
    const rows = await getFredSeriesNeedingTags(client, Math.min(remaining, 25));

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const tags = await fetchSeriesTags(row.series_id);
      await updateFredSeriesTags(client, row.series_id, tags);
      syncedCount += 1;

      if (syncedCount === 1 || syncedCount % progressLogInterval === 0) {
        const elapsedSeconds = (Date.now() - startedAt) / 1000;
        const seriesPerMinute = elapsedSeconds > 0
          ? syncedCount / (elapsedSeconds / 60)
          : 0;
        const remaining = limit - syncedCount;
        const etaMinutes = seriesPerMinute > 0
          ? remaining / seriesPerMinute
          : 0;
        const percentComplete = (syncedCount / limit) * 100;

        console.log(
          `Synced ${syncedCount.toLocaleString()}/${limit.toLocaleString()} tags (${percentComplete.toFixed(1)}%) | ${seriesPerMinute.toFixed(1)} series/min | ETA ${etaMinutes.toFixed(1)} min`,
        );
      }
    }
  }

  return { syncedCount };
}
