import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils';

/**
 * Increments the credit usage for a specific user.
 * This function should only be called from a trusted server-side environment.
 * It calls a SECURITY DEFINER function in the database.
 * @param userId The ID of the user whose credits are being updated.
 * @param amount The number of credits to add to the user's usage.
 */
export async function incrementUserCredits(userId: string, amount: number): Promise<void> {
  // We only proceed if a positive amount is provided.
  if (amount <= 0) {
    return;
  }

  const supabase = await createClient();
  
  const { error } = await supabase.rpc('increment_credit_usage', {
    user_id_to_update: userId,
    credits_to_add: amount,
  });

  if (error) {
    // We log the error for monitoring but don't throw,
    // as failing to update credits should not break the user's main action.
    console.error(`Failed to increment credit usage for user ${userId}:`, getErrorMessage(error));
  }
}
