import { z } from 'zod';

export const worldBuildingNoteBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255, { message: 'Title must be 255 characters or less.' }),
  content: z.string().optional(), // Can be extensive
  category: z.string().max(100, { message: 'Category must be 100 characters or less.' }).optional().nullable(),
});

export const createWorldBuildingNoteSchema = worldBuildingNoteBaseSchema.extend({
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }),
});

export const updateWorldBuildingNoteSchema = worldBuildingNoteBaseSchema.partial();

export type CreateWorldBuildingNoteValues = z.infer<typeof createWorldBuildingNoteSchema>;
export type UpdateWorldBuildingNoteValues = z.infer<typeof updateWorldBuildingNoteSchema>;
