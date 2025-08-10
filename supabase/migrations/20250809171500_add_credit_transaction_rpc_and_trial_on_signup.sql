-- Migration: Add atomic credit transaction RPC and grant free trial credits on signup
-- NOTE: Do not modify prior migrations; this updates/extends via CREATE OR REPLACE.

-- 1) Atomic credit transaction function (RPC)
-- Uses profile_id_in UUID (profiles.id), not bigint.
CREATE OR REPLACE FUNCTION public.handle_credit_transaction(
  profile_id_in uuid,
  amount_in double precision,
  source_in text,
  expires_in_days_in int DEFAULT NULL
)
RETURNS TABLE (id uuid, email text, credit_balance double precision)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_profile record;
BEGIN
  UPDATE public.profiles
  SET credit_balance = public.profiles.credit_balance + amount_in
  WHERE public.profiles.id = profile_id_in
  RETURNING * INTO updated_profile;


  -- Insert transaction log
  INSERT INTO public.credit_transactions (profile_id, credits_amount, source, expires_at)
  VALUES (
    profile_id_in,
    amount_in,
    source_in,
    CASE
      WHEN expires_in_days_in IS NOT NULL THEN now() + (expires_in_days_in * INTERVAL '1 day')
      ELSE NULL
    END
  );

  -- Return the updated profile ID, null email (auth.users not joinable here), and new balance
  RETURN QUERY
  SELECT updated_profile.id, NULL::text AS email, updated_profile.credit_balance;
END;
$$;

-- Grant execute only to service_role for server-side use
REVOKE EXECUTE ON FUNCTION public.handle_credit_transaction(uuid, double precision, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_credit_transaction(uuid, double precision, text, integer) TO service_role;

-- 2) Update signup trigger function to grant free trial credits
-- This replaces the existing handle_new_user definition created earlier.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_trial_credits CONSTANT double precision := 40.0; -- Adjust as needed or pull from settings
  trial_duration_days CONSTANT integer := 14;
BEGIN
  -- Create the profile entry with optional full_name from raw_user_meta_data
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Grant free trial credits via atomic function
  PERFORM public.handle_credit_transaction(NEW.id, free_trial_credits, 'free-trial', trial_duration_days);

  RETURN NEW;
END;
$$;
