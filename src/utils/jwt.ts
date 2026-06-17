import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessPayload {
  sub: string; // user id
  email: string;
}

export interface RefreshPayload {
  sub: string; // user id
  jti: string; // refresh token id (matches refresh_tokens.id)
}

export function signAccessToken(payload: AccessPayload): string {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as any };
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, options);
}

export function signRefreshToken(payload: RefreshPayload): string {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as any };
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, options);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as unknown as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as unknown as RefreshPayload;
}
