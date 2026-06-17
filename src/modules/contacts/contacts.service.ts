import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { CreateContactInput, UpdateContactInput } from './contacts.schema';

export interface Contact {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

async function assertFolderOwned(userId: string, folderId: string): Promise<void> {
  const folder = await queryOne(
    `SELECT id FROM folders WHERE id = $1 AND user_id = $2`,
    [folderId, userId]
  );
  if (!folder) throw new AppError('Folder not found', 404);
}

export async function list(userId: string, folderId?: string): Promise<Contact[]> {
  if (folderId) {
    return query<Contact>(
      `SELECT * FROM contacts WHERE user_id = $1 AND folder_id = $2 ORDER BY name ASC`,
      [userId, folderId]
    );
  }
  return query<Contact>(`SELECT * FROM contacts WHERE user_id = $1 ORDER BY name ASC`, [userId]);
}

export async function getOne(userId: string, id: string): Promise<Contact> {
  const contact = await queryOne<Contact>(
    `SELECT * FROM contacts WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!contact) throw new AppError('Contact not found', 404);
  return contact;
}

export async function create(userId: string, input: CreateContactInput): Promise<Contact> {
  if (input.folder_id) await assertFolderOwned(userId, input.folder_id);
  const contact = await queryOne<Contact>(
    `INSERT INTO contacts (user_id, folder_id, name, phone, email, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      userId,
      input.folder_id ?? null,
      input.name,
      input.phone ?? null,
      input.email ?? null,
      input.note ?? null,
    ]
  );
  return contact as Contact;
}

export async function update(
  userId: string,
  id: string,
  input: UpdateContactInput
): Promise<Contact> {
  await getOne(userId, id);
  if (input.folder_id) await assertFolderOwned(userId, input.folder_id);
  const contact = await queryOne<Contact>(
    `UPDATE contacts SET
       folder_id = COALESCE($3, folder_id),
       name = COALESCE($4, name),
       phone = COALESCE($5, phone),
       email = COALESCE($6, email),
       note = COALESCE($7, note),
       updated_at = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [
      id,
      userId,
      input.folder_id ?? null,
      input.name ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.note ?? null,
    ]
  );
  return contact as Contact;
}

export async function remove(userId: string, id: string): Promise<void> {
  const rows = await query(
    `DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Contact not found', 404);
}
