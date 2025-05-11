CREATE TABLE public.genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE POLICY "Authenticated users can view genres."
  ON public.genres FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON TABLE public.genres TO authenticated;
GRANT ALL ON TABLE public.genres TO supabase_admin;
