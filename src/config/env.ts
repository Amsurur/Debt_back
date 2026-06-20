import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '4000', 10),

  DATABASE_URL: required('DATABASE_URL'),
  PGSSL: (process.env.PGSSL ?? 'false') === 'true',

  ACCESS_TOKEN_SECRET: required('ACCESS_TOKEN_SECRET'),
  REFRESH_TOKEN_SECRET: required('REFRESH_TOKEN_SECRET'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '2h',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? '7d',

  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  SERVER_URL: process.env.SERVER_URL ?? '',
};
