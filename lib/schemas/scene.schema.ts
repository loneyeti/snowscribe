import { z } from 'zod';

export const sceneBaseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }).max(255, { message: 'Title must be 255 characters or less.' }),
  content: z.string().optional(), // Content can be large, specific validation might be needed elsewhere or deferred
  order: z.number().int({ message: 'Order must be an integer.' }).min(0, { message: 'Order must be a non-negative number.' }).optional(),
  // Outline-related fields
  outline_description: z.string().nullable().optional(),
  pov_character_id: z.string().uuid().nullable().optional(),
  // other_character_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
  primary_category: z.enum([
    'Action',
    'Dialogue',
    'Reflection',
    'Discovery',
    'Relationship',
    'Transition',
    'Worldbuilding',
  ]).nullable().optional(), 
  notes: z.string().nullable().optional(),
});

export const createSceneSchema = sceneBaseSchema.extend({
  chapter_id: z.string().uuid({ message: 'Valid Chapter ID is required.' }),
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }), // For associating with project and user
  primary_category: z.enum([
    'Action',
    'Dialogue',
    'Reflection',
    'Discovery',
    'Relationship',
    'Transition',
    'Worldbuilding',
  ]).refine(val => val !== undefined && val !== null, {
    message: "Primary category is required."
  }),
}).omit({ tag_ids: true }); // tag_ids are usually handled by a separate endpoint after scene creation

export const updateSceneSchema = sceneBaseSchema.extend({
  other_character_ids: z.array(z.string().uuid()).optional(),
}).partial();

export type CreateSceneValues = z.infer<typeof createSceneSchema>;
export type UpdateSceneValues = z.infer<typeof updateSceneSchema>;
