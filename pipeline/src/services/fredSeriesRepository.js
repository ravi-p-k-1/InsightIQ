function toNullableValue(value) {
  return value === undefined || value === '' ? null : value;
}

export function normalizeFredSeriesForDatabase(series) {
  return {
    seriesId: series.seriesId,
    title: series.title,
    notes: toNullableValue(series.notes),
    frequency: toNullableValue(series.frequency),
    frequencyShort: toNullableValue(series.frequencyShort),
    units: toNullableValue(series.units),
    unitsShort: toNullableValue(series.unitsShort),
    seasonalAdjustment: toNullableValue(series.seasonalAdjustment),
    seasonalAdjustmentShort: toNullableValue(series.seasonalAdjustmentShort),
    observationStart: toNullableValue(series.observationStart),
    observationEnd: toNullableValue(series.observationEnd),
    lastUpdated: toNullableValue(series.lastUpdated),
    popularity: toNullableValue(series.popularity),
    groupPopularity: toNullableValue(series.groupPopularity),
    scopes: Array.isArray(series.scopes) ? series.scopes : [],
  };
}

function createEmbeddingText(series) {
  return [
    `Title: ${series.title}`,
    series.notes ? `Notes: ${series.notes}` : null,
    series.units ? `Units: ${series.units}` : null,
    series.frequency ? `Frequency: ${series.frequency}` : null,
    series.seasonalAdjustment
      ? `Seasonal adjustment: ${series.seasonalAdjustment}`
      : null,
    series.scopes.length > 0 ? `Scope: ${series.scopes.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function upsertFredSeriesBatch(client, seriesBatch) {
  if (seriesBatch.length === 0) {
    return 0;
  }

  const columnsPerRow = 16;
  const values = [];
  const placeholders = seriesBatch.map((series, rowIndex) => {
    const offset = rowIndex * columnsPerRow;
    values.push(
      series.seriesId,
      series.title,
      series.notes,
      series.frequency,
      series.frequencyShort,
      series.units,
      series.unitsShort,
      series.seasonalAdjustment,
      series.seasonalAdjustmentShort,
      series.observationStart,
      series.observationEnd,
      series.lastUpdated,
      series.popularity,
      series.groupPopularity,
      series.scopes,
      createEmbeddingText(series),
    );

    return `(${Array.from(
      { length: columnsPerRow },
      (_, columnIndex) => `$${offset + columnIndex + 1}`,
    ).join(', ')})`;
  });

  await client.query(
    `
      INSERT INTO fred_series (
        series_id,
        title,
        notes,
        frequency,
        frequency_short,
        units,
        units_short,
        seasonal_adjustment,
        seasonal_adjustment_short,
        observation_start,
        observation_end,
        last_updated,
        popularity,
        group_popularity,
        scopes,
        embedding_text
      )
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (series_id) DO UPDATE SET
        title = EXCLUDED.title,
        notes = EXCLUDED.notes,
        frequency = EXCLUDED.frequency,
        frequency_short = EXCLUDED.frequency_short,
        units = EXCLUDED.units,
        units_short = EXCLUDED.units_short,
        seasonal_adjustment = EXCLUDED.seasonal_adjustment,
        seasonal_adjustment_short = EXCLUDED.seasonal_adjustment_short,
        observation_start = EXCLUDED.observation_start,
        observation_end = EXCLUDED.observation_end,
        last_updated = EXCLUDED.last_updated,
        popularity = EXCLUDED.popularity,
        group_popularity = EXCLUDED.group_popularity,
        scopes = (
          SELECT array_agg(DISTINCT scope ORDER BY scope)
          FROM unnest(fred_series.scopes || EXCLUDED.scopes) AS scope
        ),
        embedding_text = EXCLUDED.embedding_text,
        updated_at = now()
    `,
    values,
  );

  return seriesBatch.length;
}
