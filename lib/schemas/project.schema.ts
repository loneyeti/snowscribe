import { z } from 'zod';

export const projectBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(100, { message: 'Title must be 100 characters or less.' }),
  genre_id: z.number().int({ message: 'Genre ID must be an integer.' }).positive({ message: 'Genre ID must be a positive number.' }),
  genre: z.string().min(1, { message: 'Genre is required.' }).max(100, { message: 'Genre must be 100 characters or less.' }).optional(), // Phasing out
  description: z.string().max(1000, { message: 'Description must be 1000 characters or less.' }).nullable().optional(),
  target_word_count: z.number().int({ message: 'Target word count must be an integer.' }).positive({ message: 'Target word count must be a positive number.' }).nullable().optional(),
  log_line: z.string().nullable().optional(), // Max length not typically enforced by TEXT, can add .max() if needed
  one_page_synopsis: z.string().nullable().optional(), // Max length not typically enforced by TEXT
});

// For create, some fields might be more strictly required or have defaults handled elsewhere.
// For now, createProjectSchema will also allow these as optional and nullable.
export const createProjectSchema = projectBaseSchema; 

export const updateProjectSchema = projectBaseSchema.partial().omit({ genre: true, log_line: true, one_page_synopsis: true });

export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;
