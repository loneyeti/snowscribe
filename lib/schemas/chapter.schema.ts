import { z } from 'zod';

export const chapterBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255, { message: 'Title must be 255 characters or less.' }),
  order: z.number().int({ message: 'Order must be an integer.' }).min(0, { message: 'Order must be a non-negative number.' }).optional(),
});

export const createChapterSchema = chapterBaseSchema.extend({
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }),
});

export const updateChapterSchema = chapterBaseSchema.partial();

export type CreateChapterValues = z.infer<typeof createChapterSchema>;
export type UpdateChapterValues = z.infer<typeof updateChapterSchema>;
