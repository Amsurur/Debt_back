import { createApp } from './app';
import { env } from './config/env';
import { pool } from './config/db';

const app = createApp();

pool
  .query('SELECT 1')
  .then(() => console.log('✅ Database connected'))
  .catch((err) => console.error('⚠️  Database connection failed:', err.message));

const server = app.listen(env.PORT, () => {
  const url = env.SERVER_URL || `http://localhost:${env.PORT}`;
  console.log(`🚀 Server running on ${url} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
