export async function setupFredSeriesTable(client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS vector');

  await client.query(`
    CREATE TABLE IF NOT EXISTS fred_series (
      series_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT,
      frequency TEXT,
      frequency_short TEXT,
      units TEXT,
      units_short TEXT,
      seasonal_adjustment TEXT,
      seasonal_adjustment_short TEXT,
      observation_start DATE,
      observation_end DATE,
      last_updated TIMESTAMPTZ,
      popularity INTEGER,
      group_popularity INTEGER,
      scopes TEXT[] NOT NULL DEFAULT '{}',
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      tag_names TEXT[] NOT NULL DEFAULT '{}',
      tag_group_ids TEXT[] NOT NULL DEFAULT '{}',
      tags_updated_at TIMESTAMPTZ,
      embedding vector(384),
      embedding_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    ALTER TABLE fred_series
    ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb
  `);

  await client.query(`
    ALTER TABLE fred_series
    ADD COLUMN IF NOT EXISTS tag_names TEXT[] NOT NULL DEFAULT '{}'
  `);

  await client.query(`
    ALTER TABLE fred_series
    ADD COLUMN IF NOT EXISTS tag_group_ids TEXT[] NOT NULL DEFAULT '{}'
  `);

  await client.query(`
    ALTER TABLE fred_series
    ADD COLUMN IF NOT EXISTS tags_updated_at TIMESTAMPTZ
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS fred_series_popularity_idx
    ON fred_series (popularity DESC NULLS LAST)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS fred_series_scopes_idx
    ON fred_series USING gin (scopes)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS fred_series_tag_names_idx
    ON fred_series USING gin (tag_names)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS fred_series_tag_group_ids_idx
    ON fred_series USING gin (tag_group_ids)
  `);
}

export async function createFredSeriesEmbeddingIndex(client) {
  await client.query(`
    CREATE INDEX IF NOT EXISTS fred_series_embedding_hnsw_idx
    ON fred_series
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL
  `);

  await client.query('ANALYZE fred_series');
}

export async function getFredSeriesIndexStats(client) {
  const { rows } = await client.query(`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fred_series'
    ORDER BY indexname
  `);

  return rows;
}

export async function getFredSeriesTableStats(client) {
  const { rows } = await client.query(`
    SELECT
      count(*)::integer AS total_series,
      count(*) FILTER (WHERE embedding IS NOT NULL)::integer AS embedded_series,
      count(*) FILTER (WHERE tags_updated_at IS NOT NULL)::integer AS tagged_series,
      count(*) FILTER (WHERE scopes @> ARRAY['national'])::integer AS national_series,
      count(*) FILTER (WHERE scopes @> ARRAY['state'])::integer AS state_series
    FROM fred_series
  `);

  return rows[0];
}
