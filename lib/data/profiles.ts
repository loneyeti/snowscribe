"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

/**
 * Updates a user's credit usage by calling the increment_credit_usage RPC function.
 * This should only be called from a trusted server-side environment.
 * @param userId - The UUID of the user to update
 * @param creditsToAdd - The number of credits to add (must be positive)
 * @returns Promise with success status and optional error message
 */
export async function updateCreditUsage(
  userId: string,
  creditsToAdd: number
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  if (!userId) {
    return { success: false, error: "User ID is required" };
  }
  if (creditsToAdd <= 0) {
    return { success: true }; // No operation for zero or negative credits
  }
  console.log("Called updateCreditUsage");
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("increment_credit_usage", {
      user_id_to_update: userId,
      credits_to_add: creditsToAdd,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Failed to update credit usage for user ${userId}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}
