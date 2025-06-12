// Based on supabase/migrations/20250509072432_create_projects_table.sql
// supabase/migrations/20250510093011_add_description_to_projects.sql
// supabase/migrations/20250510093630_update_projects_genre_to_fk.sql
// and components/homepage/ProjectCard.tsx
export interface Project {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  description?: string | null;
  genre_id?: number | null; // Foreign key to genres table
  genre?: string | null; // Old text field, to be phased out
  log_line?: string | null;
  one_page_synopsis?: string | null; // Added for outline feature
  target_word_count?: number | null;
  settings?: Record<string, unknown> | null; // JSONB
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // Optional fields that might be derived or added later for UI
  wordCount: number;
  thumbnailUrl?: string;
}

export * from './ai';

// Based on supabase/migrations/20250510093215_create_genres_table.sql
export interface Genre {
  id: number; // SERIAL
  name: string;
  created_at: string; // TIMESTAMPTZ
}

// Based on supabase/migrations/20250509072238_create_profiles_table.sql
export interface Profile {
  id: string; // UUID, references auth.users
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_site_admin?: boolean; // Added for admin flag
  current_period_credit_usage?: number; // Added for credit tracking
  total_credit_usage?: number; // Added for credit tracking
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Based on supabase/migrations/20250509072629_create_chapters_table.sql
export interface Chapter {
  id: string; // UUID
  project_id: string; // UUID, references projects
  title: string;
  order: number; // "order" is a reserved keyword, maps to "order" column
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  scenes?: Scene[]; // For holding nested scenes, typically id and content
  word_count: number; // Calculated field
  scene_count?: number; // Calculated field
}

// Based on supabase/migrations/20250509072734_create_scenes_table.sql
export interface Scene {
  id: string; // UUID
  chapter_id: string; // UUID, references chapters
  title?: string | null;
  content?: string | null;
  word_count?: number | null;
  order: number; // "order" is a reserved keyword, maps to "order" column
  notes?: string | null;
  outline_description?: string | null; // Added for outline feature
  pov_character_id?: string | null; // Added for outline feature, references characters(id)
  scene_characters?: Array<{ character_id: string }>; // Array of character relationships
  scene_applied_tags?: Array<{ tag_id: string }>; // Array of tag relationships
  primary_category?: PrimarySceneCategory | null; // ADD THIS LINE
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Based on supabase/migrations/20250509072906_create_scene_tags_table.sql
export interface SceneTag {
  id: string; // UUID
  project_id?: string | null; // UUID, references projects, NULLABLE for global tags
  user_id?: string | null; // UUID, references auth.users, NULLABLE
  name: string;
  description?: string | null;
  color?: string | null; // e.g. hex code
  created_at: string; // TIMESTAMPTZ
}

// PrimarySceneCategory type and constant array
export type PrimarySceneCategory =
  | 'Action'
  | 'Dialogue'
  | 'Reflection'
  | 'Discovery'
  | 'Relationship'
  | 'Transition'
  | 'Worldbuilding';

export const ALL_PRIMARY_SCENE_CATEGORIES: PrimarySceneCategory[] = [
  'Action',
  'Dialogue',
  'Reflection',
  'Discovery',
  'Relationship',
  'Transition',
  'Worldbuilding',
];

// Remove PredefinedSceneTag type and ALL_PREDEFINED_SCENE_TAGS array if present

// Based on supabase/migrations/20250509073117_create_scene_applied_tags_table.sql
export interface SceneAppliedTag {
  scene_id: string; // UUID, references scenes
  tag_id: string; // UUID, references scene_tags
  created_at: string; // TIMESTAMPTZ
}

import { z } from 'zod';
import { characterBaseSchema } from '@/lib/schemas/character.schema';

// Based on supabase/migrations/20250509073255_create_characters_table.sql
export interface Character {
  id: string; // UUID
  project_id: string; // UUID, references projects
  name: string;
  nickname?: string | null;
  description?: string | null;
  // backstory, motivations, appearance to be consolidated into description or notes as per schema
  appearance?: string | null; // Keeping appearance for now, can be part of description
  notes?: string | null; // Aligning with schema (TEXT field)
  image_url?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type CharacterFormValues = z.infer<typeof characterBaseSchema>;

// Based on supabase/migrations/20250509073406_create_scene_characters_table.sql
export interface SceneCharacter {
  scene_id: string; // UUID, references scenes
  character_id: string; // UUID, references characters
  created_at: string; // TIMESTAMPTZ
}

// Based on supabase/migrations/20250509073509_create_world_building_notes_table.sql
export interface WorldBuildingNote {
  id: string; // UUID
  project_id: string; // UUID, references projects
  title: string;
  content?: string | null; // Can be Markdown
  category?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// OutlineItem interface removed as the table is being removed.

// Based on supabase/migrations/20250509074322_create_ai_interactions_table.sql
export interface AIInteraction {
  id: string; // UUID
  project_id: string; // UUID, references projects
  user_id: string; // UUID, references auth.users
  feature_used: string;
  ai_model_used?: string | null;
  input_context?: Record<string, unknown> | null; // JSONB
  prompt_text?: string | null;
  response_data?: Record<string, unknown> | null; // JSONB
  user_feedback?: string | null;
  created_at: string; // TIMESTAMPTZ
}

// Add other shared types here as the project grows

// Based on supabase/migrations/20250511201800_create_ai_vendors_table.sql
export interface AIVendor {
  id: string; // UUID
  name: string;
  api_key_env_var?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Based on supabase/migrations/20250511201801_create_ai_models_table.sql
// This aligns with snowgander's ModelConfig but includes DB fields
// and uses number for costs (representing micro-cents or similar micro-units).
export interface AIModel {
  id: string; // UUID
  vendor_id: string; // UUID, references ai_vendors
  name: string; // User-friendly name
  api_name: string; // Name vendor API expects
  is_vision: boolean;
  is_image_generation: boolean;
  is_thinking: boolean;
  input_token_cost_micros?: number | null; // Cost per million input tokens in micro-units
  output_token_cost_micros?: number | null; // Cost per million output tokens in micro-units
  max_tokens?: number | null; // Default max tokens for this model
  notes?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export type { UpdateSceneValues } from '../schemas/scene.schema';
// Based on supabase/migrations/20250511201802_create_ai_prompts_table.sql
export interface AIPrompt {
  id: string; // UUID
  project_id?: string | null; // UUID, references projects
  user_id?: string | null; // UUID, references auth.users
  name: string;
  prompt_text: string;
  category?: string | null;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}
