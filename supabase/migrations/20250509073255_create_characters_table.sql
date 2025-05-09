-- Create characters table
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  description TEXT,
  backstory TEXT,
  motivations TEXT,
  appearance TEXT,
  notes JSONB, -- For flexible, unstructured data, AI Q&A
  image_url TEXT, -- Path to image in Supabase Storage
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Policies for characters
-- Users can view characters belonging to their projects.
CREATE POLICY "Users can view characters for their projects"
  ON public.characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = characters.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert characters into their own projects.
CREATE POLICY "Users can insert characters for their projects"
  ON public.characters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = characters.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can update characters belonging to their projects.
CREATE POLICY "Users can update characters for their projects"
  ON public.characters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = characters.project_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = characters.project_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete characters belonging to their projects.
CREATE POLICY "Users can delete characters for their projects"
  ON public.characters FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = characters.project_id AND p.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on character update
CREATE TRIGGER on_character_updated
  BEFORE UPDATE ON public.characters
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the characters table
GRANT ALL ON TABLE public.characters TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.characters TO authenticated;
