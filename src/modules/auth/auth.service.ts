import { randomUUID } from 'crypto';
import { query, queryOne } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  RefreshPayload,
} from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import { RegisterInput, LoginInput } from './auth.schema';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

function toPublic(u: UserRow): PublicUser {
  return { id: u.id, name: u.name, email: u.email, created_at: u.created_at };
}

/** Convert a TTL string like "7d" / "15m" / "30s" / "12h" to milliseconds. */
function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000;
  return n * mult;
}

async function issueTokens(user: { id: string; email: string }): Promise<Tokens> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const jti = randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  const expiresAt = new Date(Date.now() + ttlToMs(env.REFRESH_TOKEN_TTL));

  await query(
    `INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES ($1, $2, $3)`,
    [jti, user.id, expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<{ user: PublicUser } & Tokens> {
  const existing = await queryOne<UserRow>(`SELECT * FROM users WHERE email = $1`, [input.email]);
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await hashPassword(input.password);
  const user = await queryOne<UserRow>(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
    [input.name, input.email, passwordHash]
  );
  if (!user) throw new AppError('Failed to create user', 500);

  const tokens = await issueTokens(user);
  return { user: toPublic(user), ...tokens };
}

export async function login(input: LoginInput): Promise<{ user: PublicUser } & Tokens> {
  const user = await queryOne<UserRow>(`SELECT * FROM users WHERE email = $1`, [input.email]);
  if (!user) throw new AppError('Invalid email or password', 401);

  const ok = await comparePassword(input.password, user.password_hash);
  if (!ok) throw new AppError('Invalid email or password', 401);

  const tokens = await issueTokens(user);
  return { user: toPublic(user), ...tokens };
}

export async function refresh(token: string): Promise<Tokens> {
  let payload: RefreshPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await queryOne<{
    id: string;
    user_id: string;
    revoked: boolean;
    expires_at: string;
  }>(`SELECT id, user_id, revoked, expires_at FROM refresh_tokens WHERE id = $1`, [payload.jti]);

  if (!stored || stored.revoked) throw new AppError('Refresh token revoked', 401);
  if (new Date(stored.expires_at) < new Date()) throw new AppError('Refresh token expired', 401);

  // Rotate: revoke the used token, issue a fresh pair.
  await query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [payload.jti]);

  const user = await queryOne<UserRow>(`SELECT * FROM users WHERE id = $1`, [payload.sub]);
  if (!user) throw new AppError('User not found', 401);

  return issueTokens(user);
}

export async function logout(token: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(token);
    await query(`UPDATE refresh_tokens SET revoked = true WHERE id = $1`, [payload.jti]);
  } catch {
    // Token already invalid — nothing to revoke.
  }
}
