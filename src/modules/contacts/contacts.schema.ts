import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  note: z.string().max(1000).optional(),
  folder_id: z.string().uuid().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
