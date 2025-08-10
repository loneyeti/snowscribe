import { getErrorMessage } from '@/lib/utils';
import { creditService } from '@/lib/services/credit.service';

/**
 * Deducts credits from a user's balance for usage (e.g., AI calls).
 * Uses the atomic handle_credit_transaction RPC via a service-role client.
 * @param userId The ID of the user/profile (profiles.id == auth.users.id).
 * @param amount The number of credits to deduct from the user's balance (must be positive).
 */
export async function incrementUserCredits(userId: string, amount: number): Promise<void> {
  // Keep the function name for backward compatibility with existing callers.
  // Behavior: deduct credits from balance by the specified positive amount.
  if (amount <= 0) {
    return;
  }
  try {
    await creditService.deductCredits(userId, amount, 'ai-usage');
  } catch (err) {
    console.error(
      `Failed to deduct credits for user ${userId}:`,
      getErrorMessage(err instanceof Error ? err : (err as unknown as Error))
    );
  }
}
