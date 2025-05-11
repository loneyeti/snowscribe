import { z } from 'zod';

// Base schema for world building note form values, used for create and update
export const worldBuildingNoteBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255, { message: 'Title must be 255 characters or less.' }),
  content: z.string().optional().nullable(),
  category: z.string().max(100, { message: 'Category must be 100 characters or less.' }).optional().nullable(),
});

// Schema for creating a new world building note (includes project_id)
export const createWorldBuildingNoteSchema = worldBuildingNoteBaseSchema.extend({
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }),
});

// Schema for updating an existing world building note (all fields optional)
export const updateWorldBuildingNoteSchema = worldBuildingNoteBaseSchema.partial();

// Type inferred from the base schema for form handling
export type WorldBuildingNoteFormValues = z.infer<typeof worldBuildingNoteBaseSchema>;
