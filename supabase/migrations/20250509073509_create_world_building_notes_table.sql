-- Create world_building_notes table
CREATE TABLE public.world_building_notes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Can be Markdown
  category TEXT, -- e.g., "Locations", "Magic", "Tech"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.world_building_notes ENABLE ROW LEVEL SECURITY;

-- Policies for world_building_notes
-- Users can view world building notes belonging to their projects.
CREATE POLICY "Users can view world building notes for their projects"
  ON public.world_building_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = world_building_notes.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert world building notes into their own projects.
CREATE POLICY "Users can insert world building notes for their projects"
  ON public.world_building_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = world_building_notes.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update world building notes belonging to their projects.
CREATE POLICY "Users can update world building notes for their projects"
  ON public.world_building_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = world_building_notes.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = world_building_notes.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete world building notes belonging to their projects.
CREATE POLICY "Users can delete world building notes for their projects"
  ON public.world_building_notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = world_building_notes.project_id AND p.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on world_building_note update
CREATE TRIGGER on_world_building_note_updated
  BEFORE UPDATE ON public.world_building_notes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the world_building_notes table
GRANT ALL ON TABLE public.world_building_notes TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.world_building_notes TO authenticated;
