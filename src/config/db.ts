import { Pool, types, QueryResultRow } from 'pg';
import { env } from './env';

// Postgres NUMERIC (oid 1700) comes back as a string by default.
// Parse it into a JS number so amounts/sums are easy to work with.
// NOTE: this uses floating point. Fine for an app like this; for banking-grade
// precision you would keep it as a string and use a decimal library.
types.setTypeParser(1700, (val: string) => parseFloat(val));

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.PGSSL ? { rejectUnauthorized: false } : undefined,
});

/** Run a query and return all rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

/** Run a query and return the first row, or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
