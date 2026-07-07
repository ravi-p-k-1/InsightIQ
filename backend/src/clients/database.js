import pg from 'pg'
import { getRequiredEnv } from '../utils/env.js'

const { Pool } = pg

let pool

export function getDatabasePool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getRequiredEnv('DATABASE_URL'),
    })
  }

  return pool
}

export async function withDatabaseClient(callback) {
  const client = await getDatabasePool().connect()

  try {
    return await callback(client)
  } finally {
    client.release()
  }
}
