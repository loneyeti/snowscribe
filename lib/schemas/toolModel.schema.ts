import { z } from 'zod';

export const toolModelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  model_id: z.string().uuid('Model ID must be a valid UUID'),
});

export type ToolModel = z.infer<typeof toolModelSchema>;
