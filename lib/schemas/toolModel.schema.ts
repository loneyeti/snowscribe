import { z } from 'zod';
import { aiModelSchema } from './aiModel.schema';

// Base ToolModel schema
export const toolModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  model_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ToolModel = z.infer<typeof toolModelSchema>;

// Schema for ToolModel when AIModel data is included
export const toolModelWithAIModelSchema = toolModelSchema.extend({
  ai_models: aiModelSchema.pick({
    id: true,
    name: true,
    api_name: true,
    vendor_id: true,
  }).extend({
    ai_vendors: z.object({ name: z.string() }).optional()
  }).nullable(),
});
export type ToolModelWithAIModel = z.infer<typeof toolModelWithAIModelSchema>;

// Schema for updating a tool model
export const updateToolModelValuesSchema = z.object({
  model_id: z.string().uuid({ message: "Valid AI Model ID is required." }),
});
export type UpdateToolModelValues = z.infer<typeof updateToolModelValuesSchema>;
