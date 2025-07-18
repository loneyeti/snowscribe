import { z } from 'zod';

export const characterBaseSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(255, { message: 'Name must be 255 characters or less.' }),
  description: z.string().max(1000, { message: 'Description must be 1000 characters or less.' }).optional(),
  notes: z.string().nullable().optional(), // Can be extensive, similar to scene content
  image_url: z.union([
    z.string().url({ message: 'Image URL must be a valid URL.' }),
    z.literal(''),
    /* z.null(), */
    z.undefined()
  ])
  .optional()
  .transform(val => val === null ? '' : val), // Convert null to empty string
});

export const createCharacterSchema = characterBaseSchema.extend({
  project_id: z.string().uuid({ message: 'Valid Project ID is required.' }),
});

export const updateCharacterSchema = characterBaseSchema.partial();

export type CreateCharacterValues = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterValues = z.infer<typeof updateCharacterSchema>;
