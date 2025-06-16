-- Create function for atomic credit usage updates
CREATE OR REPLACE FUNCTION public.increment_credit_usage(
  user_id_to_update UUID,
  credits_to_add numberic
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate inputs
  IF credits_to_add <= 0 THEN
    RETURN; -- No operation for zero or negative credits
  END IF;

  -- Perform atomic update of both credit fields
  UPDATE public.profiles
  SET
    current_period_credit_usage = current_period_credit_usage + credits_to_add,
    total_credit_usage = total_credit_usage + credits_to_add
  WHERE
    id = user_id_to_update;
END;
$$;

-- Grant execute permissions
-- REVOKE dangerous permission from all authenticated users
REVOKE EXECUTE ON FUNCTION public.increment_credit_usage(UUID, BIGINT) FROM authenticated;

-- GRANT permission ONLY to the service_role, which is used in secure server environments
GRANT EXECUTE ON FUNCTION public.increment_credit_usage(UUID, BIGINT) TO service_role;

-- Add function to supabase_realtime publication if needed
-- ALTER PUBLICATION supabase_realtime ADD FUNCTION public.increment_credit_usage;
