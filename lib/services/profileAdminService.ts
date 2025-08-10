import { createServiceRoleClient } from '@/lib/supabase/service';
import type { Profile } from '@/lib/types';

class ProfileService {
  private supabase = createServiceRoleClient();

  async findByAuthId(authId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', authId)
      .single();

    // PGRST116 is "no rows found", return null in that case
    if (error && error.code !== 'PGRST116') throw error;
    return (data as unknown as Profile) ?? null;
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data as unknown as Profile) ?? null;
  }

  async checkCreditBalance(profileId: string, costInCredits: number): Promise<void> {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('credit_balance, has_unlimited_credits')
      .eq('id', profileId)
      .single();

    if (error || !profile) throw new Error(`Profile with ID ${profileId} not found.`);
    if (profile.has_unlimited_credits) return;

    if ((profile.credit_balance ?? 0) < costInCredits) {
      throw new Error(
        `Insufficient credits. Required: ${costInCredits}, Available: ${profile.credit_balance ?? 0}`
      );
    }
  }

  async updateProfile(profileId: string, data: Partial<Profile>): Promise<Profile> {
    const { data: updatedProfile, error } = await this.supabase
      .from('profiles')
      .update(data as Record<string, unknown>)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return updatedProfile as unknown as Profile;
  }
}

export const profileService = new ProfileService();
