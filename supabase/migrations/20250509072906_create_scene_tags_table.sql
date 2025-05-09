-- Create scene_tags table
CREATE TABLE public.scene_tags (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- NULLABLE for global/system tags
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULLABLE, if user-created for a project
  name TEXT NOT NULL,
  description TEXT,
  color TEXT, -- e.g. hex code for UI display
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  CONSTRAINT unique_project_tag_name UNIQUE (project_id, name) -- Ensures (project_id, name) is unique
  -- The global tag uniqueness (name is unique when project_id is NULL) will be handled by a partial unique index below
);

-- Create a partial unique index for global tags (name is unique when project_id IS NULL)
CREATE UNIQUE INDEX scene_tags_global_name_unique_idx ON public.scene_tags (name) WHERE (project_id IS NULL);

-- Enable Row Level Security
ALTER TABLE public.scene_tags ENABLE ROW LEVEL SECURITY;

-- Policies for scene_tags
-- Users can view global tags (project_id IS NULL).
CREATE POLICY "Users can view global scene tags"
  ON public.scene_tags FOR SELECT
  USING (project_id IS NULL);

-- Users can view tags for their own projects.
CREATE POLICY "Users can view project-specific scene tags"
  ON public.scene_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = scene_tags.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert tags for their own projects.
CREATE POLICY "Users can insert project-specific scene tags"
  ON public.scene_tags FOR INSERT
  WITH CHECK (
    (project_id IS NOT NULL AND user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = scene_tags.project_id AND p.user_id = auth.uid()
    )) OR (project_id IS NULL AND user_id IS NULL) -- Allow admin/system to create global tags
  );

-- Users can update tags they created for their projects.
CREATE POLICY "Users can update their project-specific scene tags"
  ON public.scene_tags FOR UPDATE
  USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = scene_tags.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = scene_tags.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete tags they created for their projects.
CREATE POLICY "Users can delete their project-specific scene tags"
  ON public.scene_tags FOR DELETE
  USING (
    user_id = auth.uid() AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = scene_tags.project_id AND p.user_id = auth.uid()
    )
  );
-- Note: Deleting global tags would likely be an admin-only operation, not covered by typical user RLS.

-- Grant permissions on the scene_tags table
GRANT ALL ON TABLE public.scene_tags TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scene_tags TO authenticated;
GRANT SELECT ON TABLE public.scene_tags TO anon; -- Allow anon to see global tags
