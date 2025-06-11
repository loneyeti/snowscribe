// lib/services/genreService.ts
import 'server-only';
import { createClient } from '../supabase/server';
import type { Genre } from '../types';

/**
 * Fetches all genres from the database, ordered by name.
 * This is a low-level data access function.
 * It does not perform any user-specific checks.
 */
export async function getGenres(): Promise<Genre[]> {
  const supabase = await createClient();
  const { data: genres, error } = await supabase
    .from("genres")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching genres from service:", error);
    throw new Error("Failed to fetch genres.");
  }

  return genres || [];
}
