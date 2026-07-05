import pg from 'pg';

import { getRequiredEnv } from '../utils/env.js';

const { Pool } = pg;

export function createDatabasePool() {
  return new Pool({
    connectionString: getRequiredEnv('DATABASE_URL'),
  });
}

export async function withDatabaseClient(callback) {
  const pool = createDatabasePool();

  try {
    const client = await pool.connect();

    try {
      return await callback(client);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
