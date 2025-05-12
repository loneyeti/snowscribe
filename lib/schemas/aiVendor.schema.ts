import { z } from 'zod';

export const aiVendorSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation, present for fetched data
  name: z.string().min(1, "Vendor name is required"),
  api_key_env_var: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AIVendorFormData = z.infer<typeof aiVendorSchema>;
