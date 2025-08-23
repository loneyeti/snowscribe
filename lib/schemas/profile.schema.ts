import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name cannot be empty.').max(255).nullable().optional(),
  pen_name: z.string().max(255, 'Pen name must be 255 characters or less.').nullable().optional(),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
