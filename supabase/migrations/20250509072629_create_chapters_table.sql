-- Create chapters table
CREATE TABLE public.chapters (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL, -- "order" is a reserved keyword, so it needs to be quoted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Policies for chapters
-- Users can view chapters belonging to their projects.
CREATE POLICY "Users can view chapters for their projects"
  ON public.chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  );

-- Users can insert chapters into their own projects.
CREATE POLICY "Users can insert chapters for their projects"
  ON public.chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  );

-- Users can update chapters belonging to their projects.
CREATE POLICY "Users can update chapters for their projects"
  ON public.chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  );

-- Users can delete chapters belonging to their projects.
CREATE POLICY "Users can delete chapters for their projects"
  ON public.chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on chapter update
CREATE TRIGGER on_chapter_updated
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the chapters table
GRANT ALL ON TABLE public.chapters TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chapters TO authenticated;
-- Anon users should not typically access chapters directly, RLS handles per-user access.
