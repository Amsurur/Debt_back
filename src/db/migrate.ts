import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/db';

async function migrate(): Promise<void> {
  const schemaPath = join(__dirname, 'schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  console.log('✅ Migration complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
