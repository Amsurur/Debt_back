import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const createDebtSchema = z.object({
  contact_id: z.string().uuid(),
  direction: z.enum(['they_owe_me', 'i_owe_them']),
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().min(1).max(8).default('USD'),
  description: z.string().max(1000).optional(),
  due_date: isoDate.optional(),
});

export const updateDebtSchema = z.object({
  contact_id: z.string().uuid().optional(),
  direction: z.enum(['they_owe_me', 'i_owe_them']).optional(),
  amount: z.number().positive().max(1_000_000_000).optional(),
  currency: z.string().min(1).max(8).optional(),
  description: z.string().max(1000).optional(),
  due_date: isoDate.optional(),
  status: z.enum(['pending', 'partial', 'paid']).optional(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  note: z.string().max(500).optional(),
  paid_at: z.string().optional(),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
