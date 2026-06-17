import { query, queryOne } from '../../config/db';

interface DirectionTotal {
  direction: string;
  total: number;
}
interface DirectionOutstanding {
  direction: string;
  outstanding: number;
}
interface StatusCount {
  status: string;
  c: string; // COUNT() returns bigint -> string
}

export async function summary(userId: string) {
  // Original totals per direction.
  const totals = await query<DirectionTotal>(
    `SELECT direction, COALESCE(SUM(amount), 0) AS total
     FROM debts WHERE user_id = $1 GROUP BY direction`,
    [userId]
  );

  // Outstanding = amount - payments, for debts not fully paid.
  const outstanding = await query<DirectionOutstanding>(
    `SELECT d.direction,
            COALESCE(SUM(d.amount - COALESCE(p.paid, 0)), 0) AS outstanding
     FROM debts d
     LEFT JOIN (
       SELECT debt_id, SUM(amount) AS paid FROM payments GROUP BY debt_id
     ) p ON p.debt_id = d.id
     WHERE d.user_id = $1 AND d.status <> 'paid'
     GROUP BY d.direction`,
    [userId]
  );

  const statusRows = await query<StatusCount>(
    `SELECT status, COUNT(*) AS c FROM debts WHERE user_id = $1 GROUP BY status`,
    [userId]
  );

  const contactsRow = await queryOne<{ c: string }>(
    `SELECT COUNT(*) AS c FROM contacts WHERE user_id = $1`,
    [userId]
  );

  const upcoming = await query(
    `SELECT d.id, d.amount, d.currency, d.direction, d.due_date, d.status,
            c.name AS contact_name
     FROM debts d
     JOIN contacts c ON c.id = d.contact_id
     WHERE d.user_id = $1
       AND d.status <> 'paid'
       AND d.due_date IS NOT NULL
       AND d.due_date <= (CURRENT_DATE + INTERVAL '30 days')
     ORDER BY d.due_date ASC
     LIMIT 10`,
    [userId]
  );

  const totalTheyOwe = totals.find((t) => t.direction === 'they_owe_me')?.total ?? 0;
  const totalIOwe = totals.find((t) => t.direction === 'i_owe_them')?.total ?? 0;
  const outTheyOwe = outstanding.find((t) => t.direction === 'they_owe_me')?.outstanding ?? 0;
  const outIOwe = outstanding.find((t) => t.direction === 'i_owe_them')?.outstanding ?? 0;

  const counts = { pending: 0, partial: 0, paid: 0, total: 0 };
  for (const row of statusRows) {
    const n = Number(row.c);
    if (row.status === 'pending') counts.pending = n;
    else if (row.status === 'partial') counts.partial = n;
    else if (row.status === 'paid') counts.paid = n;
    counts.total += n;
  }

  return {
    totals: {
      they_owe_me: totalTheyOwe,
      i_owe_them: totalIOwe,
    },
    outstanding: {
      they_owe_me: outTheyOwe,
      i_owe_them: outIOwe,
      net_balance: outTheyOwe - outIOwe, // positive => net owed to you
    },
    counts,
    contacts_count: Number(contactsRow?.c ?? 0),
    upcoming_due: upcoming,
  };
}
