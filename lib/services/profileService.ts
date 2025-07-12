import 'server-only';
import { createClient } from '../supabase/server';
import type { Profile } from '../types';
import { updateProfileSchema, type UpdateProfileValues } from '../schemas/profile.schema';

export async function getProfileForUser(userId: string): Promise<Pick<Profile, 'id' | 'is_site_admin' | 'full_name' | 'pen_name'> | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, is_site_admin, full_name, pen_name')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        throw new Error('Failed to fetch profile.');
    }
    return data;
}

export async function updateProfile(userId: string, profileData: UpdateProfileValues): Promise<Profile> {
  const supabase = await createClient();
  const validatedData = updateProfileSchema.parse(profileData);

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating profile for user ${userId}:`, error);
    throw new Error('Failed to update profile.');
  }

  return updatedProfile;
}
