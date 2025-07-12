ALTER TABLE public.profiles
ADD COLUMN pen_name TEXT;

ALTER TABLE public.profiles
ALTER COLUMN full_name DROP NOT NULL;

-- Allow authenticated users to update their new pen_name field
DROP POLICY IF EXISTS "Users can update their own profile (excluding admin/credit fields)." ON public.profiles;

CREATE POLICY "Users can update their own profile (excluding admin/credit fields)."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
  
GRANT UPDATE (username, full_name, avatar_url, pen_name) ON public.profiles TO authenticated;
