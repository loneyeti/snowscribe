-- supabase/migrations/20250713110000_add_unique_constraints_for_outline.sql

-- Add a unique constraint to the characters table.
-- This ensures that within a single project, every character name is unique.
-- This constraint is required for the ON CONFLICT clause in the create_full_outline function.
ALTER TABLE public.characters
ADD CONSTRAINT characters_project_id_name_key UNIQUE (project_id, name);


-- Add a unique constraint to the scene_tags table for project-specific tags.
-- The existing unique index only covers global tags (where project_id is NULL).
-- This new constraint ensures that within a single project, every tag name is unique.
-- This is also required for an ON CONFLICT clause.
-- NOTE: We create a partial index because the name only needs to be unique
-- in the scope of a project if the project_id is not null.
CREATE UNIQUE INDEX scene_tags_project_id_name_unique_idx
ON public.scene_tags (project_id, name)
WHERE project_id IS NOT NULL;