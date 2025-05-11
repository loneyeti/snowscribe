import { z } from 'zod';

export const outlineItemBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255, { message: 'Title must be 255 characters or less.' }),
  content: z.string().optional(),
  order: z.number().int({ message: 'Order must be an integer.' }).min(0, { message: 'Order must be a non-negative number.' }).optional(),
  parent_id: z.string().uuid({ message: 'Parent ID must be a valid UUID.' }).optional().nullable(), // For hierarchical structure
});

export const createOutlineItemSchema = outlineItemBaseSchema.extend({
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }),
});

export const updateOutlineItemSchema = outlineItemBaseSchema.partial();

export type CreateOutlineItemValues = z.infer<typeof createOutlineItemSchema>;
export type UpdateOutlineItemValues = z.infer<typeof updateOutlineItemSchema>;
