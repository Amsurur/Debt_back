import { query, queryOne } from '../../config/db';
import { AppError } from '../../utils/AppError';
import { CreateDebtInput, UpdateDebtInput, CreatePaymentInput } from './debts.schema';

export type Direction = 'they_owe_me' | 'i_owe_them';
export type DebtStatus = 'pending' | 'partial' | 'paid';

export interface Debt {
  id: string;
  user_id: string;
  contact_id: string;
  direction: Direction;
  amount: number;
  currency: string;
  description: string | null;
  due_date: string | null;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  paid_at: string;
  created_at: string;
}

interface DebtFilters {
  status?: string;
  contact_id?: string;
  direction?: string;
}

async function assertContactOwned(userId: string, contactId: string): Promise<void> {
  const contact = await queryOne(
    `SELECT id FROM contacts WHERE id = $1 AND user_id = $2`,
    [contactId, userId]
  );
  if (!contact) throw new AppError('Contact not found', 404);
}

export async function list(userId: string, filters: DebtFilters): Promise<Debt[]> {
  const conditions = ['user_id = $1'];
  const params: any[] = [userId];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.contact_id) {
    params.push(filters.contact_id);
    conditions.push(`contact_id = $${params.length}`);
  }
  if (filters.direction) {
    params.push(filters.direction);
    conditions.push(`direction = $${params.length}`);
  }

  return query<Debt>(
    `SELECT * FROM debts WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    params
  );
}

export async function getOne(userId: string, id: string): Promise<Debt> {
  const debt = await queryOne<Debt>(
    `SELECT * FROM debts WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!debt) throw new AppError('Debt not found', 404);
  return debt;
}

export async function create(userId: string, input: CreateDebtInput): Promise<Debt> {
  await assertContactOwned(userId, input.contact_id);
  const debt = await queryOne<Debt>(
    `INSERT INTO debts (user_id, contact_id, direction, amount, currency, description, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      userId,
      input.contact_id,
      input.direction,
      input.amount,
      input.currency,
      input.description ?? null,
      input.due_date ?? null,
    ]
  );
  return debt as Debt;
}

export async function update(userId: string, id: string, input: UpdateDebtInput): Promise<Debt> {
  await getOne(userId, id);
  if (input.contact_id) await assertContactOwned(userId, input.contact_id);

  const debt = await queryOne<Debt>(
    `UPDATE debts SET
       contact_id  = COALESCE($3, contact_id),
       direction   = COALESCE($4, direction),
       amount      = COALESCE($5, amount),
       currency    = COALESCE($6, currency),
       description = COALESCE($7, description),
       due_date    = COALESCE($8, due_date),
       status      = COALESCE($9, status),
       updated_at  = now()
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [
      id,
      userId,
      input.contact_id ?? null,
      input.direction ?? null,
      input.amount ?? null,
      input.currency ?? null,
      input.description ?? null,
      input.due_date ?? null,
      input.status ?? null,
    ]
  );
  return debt as Debt;
}

export async function remove(userId: string, id: string): Promise<void> {
  const rows = await query(
    `DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (rows.length === 0) throw new AppError('Debt not found', 404);
}

// ── Payments ──────────────────────────────────────────────────────────────

export async function listPayments(userId: string, debtId: string): Promise<Payment[]> {
  await getOne(userId, debtId); // ownership check
  return query<Payment>(
    `SELECT * FROM payments WHERE debt_id = $1 AND user_id = $2 ORDER BY paid_at DESC`,
    [debtId, userId]
  );
}

export async function addPayment(
  userId: string,
  debtId: string,
  input: CreatePaymentInput
): Promise<{ payment: Payment; debt: Debt }> {
  const debt = await getOne(userId, debtId);

  const payment = await queryOne<Payment>(
    `INSERT INTO payments (debt_id, user_id, amount, note, paid_at)
     VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, now())) RETURNING *`,
    [debtId, userId, input.amount, input.note ?? null, input.paid_at ?? null]
  );

  // Recompute status from total payments.
  const paidRow = await queryOne<{ total_paid: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE debt_id = $1`,
    [debtId]
  );
  const totalPaid = paidRow?.total_paid ?? 0;

  let status: DebtStatus = 'pending';
  if (totalPaid >= debt.amount) status = 'paid';
  else if (totalPaid > 0) status = 'partial';

  const updated = await queryOne<Debt>(
    `UPDATE debts SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [debtId, status]
  );

  return { payment: payment as Payment, debt: updated as Debt };
}
