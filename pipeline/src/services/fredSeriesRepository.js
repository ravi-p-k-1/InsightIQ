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

export async function getFredSeriesNeedingEmbeddings(
  client,
  limit,
  options = {},
) {
  const taggedOnly = options.taggedOnly ?? false;
  const { rows } = await client.query(
    `
      SELECT series_id, embedding_text
      FROM fred_series
      WHERE embedding IS NULL
        AND embedding_text IS NOT NULL
        AND embedding_text <> ''
        AND ($2::boolean = false OR tags_updated_at IS NOT NULL)
      ORDER BY popularity DESC NULLS LAST, series_id ASC
      LIMIT $1
    `,
    [limit, taggedOnly],
  );

  return rows;
}

export async function prepareTaggedSeriesEmbeddings(client) {
  const clearUntaggedResult = await client.query(`
    UPDATE fred_series
    SET embedding = NULL,
        updated_at = now()
    WHERE tags_updated_at IS NULL
      AND embedding IS NOT NULL
  `);

  const prepareTaggedResult = await client.query(`
    UPDATE fred_series
    SET embedding_text = concat_ws(
          E'\n',
          'Series ID: ' || series_id,
          'Title: ' || title,
          CASE
            WHEN cardinality(tag_names) > 0
              THEN 'Tags: ' || array_to_string(tag_names, ', ')
            ELSE NULL
          END,
          CASE WHEN units IS NOT NULL THEN 'Units: ' || units ELSE NULL END,
          CASE
            WHEN frequency IS NOT NULL THEN 'Frequency: ' || frequency
            ELSE NULL
          END,
          CASE
            WHEN seasonal_adjustment IS NOT NULL
              THEN 'Seasonal adjustment: ' || seasonal_adjustment
            ELSE NULL
          END,
          CASE
            WHEN cardinality(scopes) > 0
              THEN 'Scope: ' || array_to_string(scopes, ', ')
            ELSE NULL
          END
        ),
        embedding = NULL,
        updated_at = now()
    WHERE tags_updated_at IS NOT NULL
  `);

  return {
    clearedUntaggedEmbeddings: clearUntaggedResult.rowCount,
    preparedTaggedSeries: prepareTaggedResult.rowCount,
  };
}

export async function prepareMissingTaggedSeriesEmbeddings(client) {
  const prepareTaggedResult = await client.query(`
    UPDATE fred_series
    SET embedding_text = concat_ws(
          E'\n',
          'Series ID: ' || series_id,
          'Title: ' || title,
          CASE
            WHEN cardinality(tag_names) > 0
              THEN 'Tags: ' || array_to_string(tag_names, ', ')
            ELSE NULL
          END,
          CASE WHEN units IS NOT NULL THEN 'Units: ' || units ELSE NULL END,
          CASE
            WHEN frequency IS NOT NULL THEN 'Frequency: ' || frequency
            ELSE NULL
          END,
          CASE
            WHEN seasonal_adjustment IS NOT NULL
              THEN 'Seasonal adjustment: ' || seasonal_adjustment
            ELSE NULL
          END,
          CASE
            WHEN cardinality(scopes) > 0
              THEN 'Scope: ' || array_to_string(scopes, ', ')
            ELSE NULL
          END
        ),
        updated_at = now()
    WHERE tags_updated_at IS NOT NULL
      AND embedding IS NULL
  `);

  return {
    preparedTaggedSeries: prepareTaggedResult.rowCount,
  };
}

export async function updateFredSeriesEmbedding(client, seriesId, embedding) {
  const vector = `[${embedding.join(',')}]`;

  await client.query(
    `
      UPDATE fred_series
      SET embedding = $2::vector,
          updated_at = now()
      WHERE series_id = $1
    `,
    [seriesId, vector],
  );
}

export async function getFredSeriesNeedingTags(client, limit) {
  const { rows } = await client.query(
    `
      SELECT series_id
      FROM fred_series
      WHERE tags_updated_at IS NULL
      ORDER BY popularity DESC NULLS LAST, series_id ASC
      LIMIT $1
    `,
    [limit],
  );

  return rows;
}

export async function updateFredSeriesTags(client, seriesId, tags) {
  const tagNames = [...new Set(tags.map((tag) => tag.name))].sort();
  const tagGroupIds = [...new Set(tags.map((tag) => tag.groupId))].sort();

  await client.query(
    `
      UPDATE fred_series
      SET tags = $2::jsonb,
          tag_names = $3,
          tag_group_ids = $4,
          tags_updated_at = now(),
          updated_at = now()
      WHERE series_id = $1
    `,
    [seriesId, JSON.stringify(tags), tagNames, tagGroupIds],
  );
}

export async function searchFredSeriesByEmbedding(client, embedding, limit) {
  const vector = `[${embedding.join(',')}]`;
  const { rows } = await client.query(
    `
      SELECT
        series_id,
        title,
        units,
        frequency,
        seasonal_adjustment,
        observation_start,
        observation_end,
        popularity,
        scopes,
        embedding <=> $1::vector AS distance
      FROM fred_series
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
    [vector, limit],
  );

  return rows.map((row) => ({
    ...row,
    similarity: 1 - Number(row.distance),
  }));
}
