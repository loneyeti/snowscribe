-- Add is_site_admin and credit usage columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_site_admin BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
ADD COLUMN current_period_credit_usage BIGINT NOT NULL DEFAULT 0,
ADD COLUMN total_credit_usage BIGINT NOT NULL DEFAULT 0;

-- Ensure credit usage can't be negative
ALTER TABLE public.profiles
ADD CONSTRAINT check_credit_usage_non_negative
CHECK (current_period_credit_usage >= 0 AND total_credit_usage >= 0);

-- Drop existing policies to recreate them with column restrictions
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;

-- Recreate view policy - users can see all columns of their own profile
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Recreate update policy - users can only update non-sensitive fields
CREATE POLICY "Users can update their own profile (excluding admin/credit fields)."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant column-level permissions (only on non-sensitive fields)
GRANT UPDATE (username, full_name, avatar_url) ON public.profiles TO authenticated;
