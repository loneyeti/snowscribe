import 'server-only';
import { createClient } from '../supabase/server';
import type { Profile } from '../types';

export async function getProfileForUser(userId: string): Promise<Pick<Profile, 'id' | 'is_site_admin'> | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, is_site_admin')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        throw new Error('Failed to fetch profile.');
    }
    return data;
}
