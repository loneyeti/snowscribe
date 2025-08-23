"use server";
import type { Profile } from '../types';
import * as profileService from '@/lib/services/profileUserService';
import { getAuthenticatedUser } from '../auth';
import type { UpdateProfileValues } from '../schemas/profile.schema';

export async function getClientProfile(): Promise<Pick<Profile, 'id' | 'is_site_admin' | 'full_name' | 'pen_name'> | null> {
  try {
    const user = await getAuthenticatedUser();
    // The service now returns the correct shape, so we just update the type here.
    return await profileService.getProfileForUser(user.id);
  } catch (error) {
    console.log("Could not get client profile, likely not logged in:", error);
    return null;
  }
}

export async function updateClientProfile(data: UpdateProfileValues): Promise<Profile> {
  const user = await getAuthenticatedUser();
  return profileService.updateProfile(user.id, data);
}

export async function getClientCreditInfo(): Promise<{ balance: number; hasUnlimited: boolean } | null> {
  try {
    const user = await getAuthenticatedUser();
    const profile = await profileService.getProfileForUser(user.id);
    if (!profile) return null;

    return {
      balance: profile.credit_balance ?? 0,
      hasUnlimited: profile.has_unlimited_credits ?? false,
    };
  } catch (error) {
    console.error("Could not fetch client credit info:", error);
    return null;
  }
}
