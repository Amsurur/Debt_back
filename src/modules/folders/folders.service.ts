import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { CreateFolderInput, UpdateFolderInput } from './folders.schema';

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export async function list(userId: string): Promise<Folder[]> {
  return query<Folder>(
    `SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getOne(userId: string, id: string): Promise<Folder> {
  const folder = await queryOne<Folder>(
    `SELECT * FROM folders WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!folder) throw new AppError('Folder not found', 404);
  return folder;
}

export async function create(userId: string, input: CreateFolderInput): Promise<Folder> {
  const folder = await queryOne<Folder>(
    `INSERT INTO folders (user_id, name, color) VALUES ($1, $2, $3) RETURNING *`,
    [userId, input.name, input.color ?? null]
  );
  return folder as Folder;
}

export async function update(
  userId: string,
  id: string,
  input: UpdateFolderInput
): Promise<Folder> {
  await getOne(userId, id); // verify ownership / existence
  const folder = await queryOne<Folder>(
    `UPDATE folders SET
       name = COALESCE($3, name),
       color = COALESCE($4, color),
       updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, input.name ?? null, input.color ?? null]
  );
  return folder as Folder;
}

export async function remove(userId: string, id: string): Promise<void> {
  const rows = await query(
    `DELETE FROM folders WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Folder not found', 404);
}
