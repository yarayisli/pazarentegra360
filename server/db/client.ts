import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export const DEFAULT_DATABASE_URL = 'postgres://pazarentegra:pazarentegra@localhost:5432/pazarentegra';

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}

// Postgres connection for the API/worker processes. Call `close()` when done.
export function createDb(url: string = getDatabaseUrl()) {
  const pool = new Pool({ connectionString: url });
  const db = drizzlePg(pool, { schema });
  return { db, close: () => pool.end() };
}

export type Db = ReturnType<typeof createDb>['db'];
export { schema };
