import { z } from 'zod';

export const aiModelSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation
  vendor_id: z.string().uuid({ message: "AI Vendor ID is required" }),
  name: z.string().min(1, "Model name is required"),
  api_name: z.string().min(1, "Vendor API model name is required"),
  is_vision: z.boolean().default(false),
  is_image_generation: z.boolean().default(false),
  is_thinking: z.boolean().default(false),
  input_token_cost_micros: z.coerce.number().int().gte(0).nullable().optional(), // gte(0) allows free models
  output_token_cost_micros: z.coerce.number().int().gte(0).nullable().optional(), // gte(0) allows free models
  max_tokens: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AIModelFormData = z.infer<typeof aiModelSchema>;
