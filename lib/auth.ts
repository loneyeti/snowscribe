// lib/auth.ts
import 'server-only';
import { createClient } from './supabase/server';
import { type User } from '@supabase/supabase-js';

/**
 * Retrieves the authenticated Supabase user on the server.
 * Throws an error if the user is not authenticated.
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If the user is not authenticated.
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Not authenticated. Please log in.');
  }

  return user;
}
