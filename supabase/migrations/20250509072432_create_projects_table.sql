-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT,
  log_line TEXT,
  target_word_count INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
CREATE POLICY "Users can view their own projects."
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects."
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects."
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects."
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp on project update
CREATE TRIGGER on_project_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Grant permissions on the projects table
GRANT ALL ON TABLE public.projects TO supabase_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
-- Anon users should not typically access projects directly, RLS handles per-user access.
-- GRANT SELECT ON TABLE public.projects TO anon;
