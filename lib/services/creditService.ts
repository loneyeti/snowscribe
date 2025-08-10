import { createServiceRoleClient } from '@/lib/supabase/service';

type HandleCreditTransactionRow = {
  id: string;
  email: string | null;
  credit_balance: number;
};

class CreditService {
  private supabase = createServiceRoleClient();

  async addCredits(
    profileId: string,
    amount: number,
    source: string,
    expiresInDays: number | null
  ): Promise<{ credit_balance: number }> {
    const { data, error } = await this.supabase.rpc('handle_credit_transaction', {
      profile_id_in: profileId,
      amount_in: amount,
      source_in: source,
      expires_in_days_in: expiresInDays,
    });

    if (error) throw new Error(`Failed to add credits: ${error.message}`);

    const rows = (data ?? []) as HandleCreditTransactionRow[];
    if (!rows || rows.length === 0) {
      throw new Error('Transaction completed but failed to return updated profile.');
    }
    return { credit_balance: rows[0].credit_balance };
  }

  async deductCredits(profileId: string, amount: number, source: string): Promise<{ credit_balance: number }> {
    if (amount <= 0) throw new Error('Deduction amount must be positive.');
    return this.addCredits(profileId, -amount, source, null);
  }
}

export const creditService = new CreditService();
