import { z } from 'zod';

export const projectBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(100, { message: 'Title must be 100 characters or less.' }),
  genre_id: z.number().int({ message: 'Genre ID must be an integer.' }).positive({ message: 'Genre ID must be a positive number.' }),
  genre: z.string().min(1, { message: 'Genre is required.' }).max(100, { message: 'Genre must be 100 characters or less.' }).optional(), // Phasing out
  description: z.string().max(1000, { message: 'Description must be 1000 characters or less.' }).optional(),
  target_word_count: z.number().int({ message: 'Target word count must be an integer.' }).positive({ message: 'Target word count must be a positive number.' }).optional(),
});

export const createProjectSchema = projectBaseSchema;

export const updateProjectSchema = projectBaseSchema.partial();

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
