import { queryOne } from '../../config/db';
import { AppError } from '../../utils/AppError';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export async function getById(id: string): Promise<PublicUser> {
  const user = await queryOne<PublicUser>(
    `SELECT id, name, email, created_at FROM users WHERE id = $1`,
    [id]
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(id: string, data: { name?: string }): Promise<PublicUser> {
  const user = await queryOne<PublicUser>(
    `UPDATE users SET name = COALESCE($2, name), updated_at = now()
     WHERE id = $1 RETURNING id, name, email, created_at`,
    [id, data.name ?? null]
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
}
