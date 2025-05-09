-- Create scenes table
CREATE TABLE public.scenes (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  "order" INTEGER NOT NULL, -- "order" is a reserved keyword, so it needs to be quoted
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;

-- Function to update word_count on scene content change
CREATE OR REPLACE FUNCTION public.update_scene_word_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NULL THEN
    NEW.word_count = 0;
  ELSE
    NEW.word_count = array_length(regexp_split_to_array(trim(NEW.content), E'\\s+'), 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update word_count when scene content is inserted or updated
CREATE TRIGGER on_scene_content_changed
  BEFORE INSERT OR UPDATE OF content ON public.scenes
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_scene_word_count();

-- Policies for scenes
-- Users can view scenes belonging to their projects (via chapters).
CREATE POLICY "Users can view scenes for their projects"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.chapters c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = scenes.chapter_id AND p.user_id = auth.uid()
    )
  );

-- Users can insert scenes into chapters of their own projects.
CREATE POLICY "Users can insert scenes for their projects"
  ON public.scenes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chapters c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = scenes.chapter_id AND p.user_id = auth.uid()
    )
  );

-- Users can update scenes belonging to their projects.
CREATE POLICY "Users can update scenes for their projects"
  ON public.scenes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.chapters c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = scenes.chapter_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chapters c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = scenes.chapter_id AND p.user_id = auth.uid()
    )
  );

-- Users can delete scenes belonging to their projects.
CREATE POLICY "Users can delete scenes for their projects"
  ON public.scenes FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.chapters c
      JOIN public.projects p ON c.project_id = p.id
      WHERE c.id = scenes.chapter_id AND p.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp on scene update
CREATE TRIGGER on_scene_updated
  BEFORE UPDATE ON public.scenes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the scenes table
GRANT ALL ON TABLE public.scenes TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scenes TO authenticated;
