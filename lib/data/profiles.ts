"use server";
import type { Profile } from '../types';
import * as profileService from '../services/profileService';
import { getAuthenticatedUser } from '../auth';
import type { UpdateProfileValues } from '../schemas/profile.schema';

export async function getClientProfile(): Promise<Pick<Profile, 'id' | 'is_site_admin' | 'full_name' | 'pen_name'> | null> {
  try {
    const user = await getAuthenticatedUser();
    return await profileService.getProfileForUser(user.id);
  } catch (error) {
    // This can fail if user is not logged in, which is a valid state.
    console.log("Could not get client profile, likely not logged in:", error);
    return null;
  }
}

export async function updateClientProfile(data: UpdateProfileValues): Promise<Profile> {
  const user = await getAuthenticatedUser();
  return profileService.updateProfile(user.id, data);
}
