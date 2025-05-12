import { z } from 'zod';

export const aiPromptSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  project_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Prompt name is required"),
  prompt_text: z.string().min(1, "Prompt text is required"),
  category: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AIPromptFormData = z.infer<typeof aiPromptSchema>;
