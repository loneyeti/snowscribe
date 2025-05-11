"use server";

import { z } from "zod";
import { type Character, type CharacterFormValues } from "@/lib/types";
import { 
  createCharacterSchema, 
  updateCharacterSchema 
} from "@/lib/schemas/character.schema";
// import { createClient } from "@/lib/supabase/server"; // No longer needed here
import { cookies } from 'next/headers'; // Import cookies

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function getCharacters(
  projectId: string
): Promise<Character[]> {
  // The responsibility of checking project ownership and user authentication
  // is now delegated to the API endpoint. This function just fetches data.
  // Ensure the API endpoint `/api/projects/${projectId}/characters` correctly
  // handles authentication and authorization.

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/characters`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch characters: ${response.status} ${
          response.statusText
        } - ${errorData.error || ""}`
      );
    }
    const data = await response.json();
    return data as Character[];
  } catch (error) {
    console.error("Error fetching characters:", error);
    // Consider how to handle errors - rethrow, return empty array, etc.
    // For now, rethrowing to be caught by the caller.
    throw error;
  }
}

export async function getCharacter(
  projectId: string,
  characterId: string
): Promise<Character | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/characters/${characterId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch character: ${response.status} ${
          response.statusText
        } - ${errorData.error || ""}`
      );
    }
    const data = await response.json();
    return data as Character;
  } catch (error) {
    console.error("Error fetching character:", error);
    throw error;
  }
}

export async function createCharacter(
  projectId: string,
  characterData: CharacterFormValues
): Promise<Character> {
  try {
    // Validate with Zod before sending - though API will also validate
    const dataToSend = { ...characterData, project_id: projectId };
    const validatedData = createCharacterSchema.parse(dataToSend);

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/characters`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
        body: JSON.stringify(validatedData), // Send validated data which includes project_id
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to create character: ${response.status} ${
          response.statusText
        } - ${errorData.error || errorData.details || ""}`
      );
    }
    const data = await response.json();
    return data as Character;
  } catch (error) {
    console.error("Error creating character:", error);
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors specifically if needed
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export async function updateCharacter(
  projectId: string,
  characterId: string,
  characterData: Partial<CharacterFormValues>
): Promise<Character> {
  try {
    // Partial validation - API will do full validation
    const validatedData = updateCharacterSchema.parse(characterData);

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/characters/${characterId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to update character: ${response.status} ${
          response.statusText
        } - ${errorData.error || errorData.details || ""}`
      );
    }
    const data = await response.json();
    return data as Character;
  } catch (error) {
    console.error("Error updating character:", error);
     if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export async function deleteCharacter(
  projectId: string,
  characterId: string
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/characters/${characterId}`,
      {
        method: "DELETE",
        headers: {
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to delete character: ${response.status} ${
          response.statusText
        } - ${errorData.error || ""}`
      );
    }
    // No content expected on successful delete
  } catch (error) {
    console.error("Error deleting character:", error);
    throw error;
  }
}
