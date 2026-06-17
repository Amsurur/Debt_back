import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

/** Request augmented with the authenticated user (set by `authenticate`). */
export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

/** Requires a valid Bearer access token; attaches req.user. */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401);
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
}
