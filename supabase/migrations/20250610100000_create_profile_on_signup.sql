-- Step 1: Create the function to be called by the trigger.
-- This function inserts a new row into public.profiles, taking the id from the new auth.users record.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a new profile record for the new user.
  -- The `id` of the new user is available in the `NEW` record.
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Step 2: Create the trigger.
-- This trigger will fire AFTER a new row is inserted into auth.users.
-- It calls the handle_new_user function for each new user row.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Step 3: Backfill existing users.
-- This script ensures that any users who signed up *before* this migration
-- was applied will also have a profile record. It's safe to run multiple times.
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
