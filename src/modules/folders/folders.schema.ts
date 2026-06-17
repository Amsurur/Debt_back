import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().max(20).optional(),
});

export const updateFolderSchema = createFolderSchema.partial();

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
