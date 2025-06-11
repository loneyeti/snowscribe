// lib/data/genres.ts
"use server";
import * as genreService from '../services/genreService';
import { getAuthenticatedUser } from '../auth';
import type { Genre } from '../types';

/**
 * Server Action to get all genres.
 * Ensures the user is authenticated before fetching.
 */
export async function getGenres(): Promise<Genre[]> {
  // Ensure user is authenticated before allowing access to genres
  await getAuthenticatedUser();
  return genreService.getGenres();
}
