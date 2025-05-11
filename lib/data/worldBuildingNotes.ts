"use server";

import { z } from "zod";
import { cookies } from 'next/headers';
import { type WorldBuildingNote } from "@/lib/types"; // Removed 'type Project'
import { 
  worldBuildingNoteBaseSchema, // For validating data before sending to API
  type WorldBuildingNoteFormValues 
} from "@/lib/schemas/worldBuildingNote.schema";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to get cookie header
async function getCookieHeader(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const cookieHeaderVal = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');
  return cookieHeaderVal ? { 'Cookie': cookieHeaderVal } : {};
}

export async function getWorldBuildingNotes(
  projectId: string
): Promise<WorldBuildingNote[]> {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/world-notes`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...cookieHeader,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Failed to fetch world building notes: ${response.status} ${response.statusText}`, errorData);
      throw new Error(
        `Failed to fetch world building notes: ${response.status} ${
          response.statusText
        } - ${errorData.error || "Unknown error"}`
      );
    }
    const data = await response.json();
    return data as WorldBuildingNote[];
  } catch (error) {
    console.error("Error in getWorldBuildingNotes:", error);
    throw error;
  }
}

export async function getWorldBuildingNote(
  projectId: string,
  noteId: string
): Promise<WorldBuildingNote | null> {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/world-notes/${noteId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...cookieHeader,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Failed to fetch world building note: ${response.status} ${response.statusText}`, errorData);
      throw new Error(
        `Failed to fetch world building note: ${response.status} ${
          response.statusText
        } - ${errorData.error || "Unknown error"}`
      );
    }
    const data = await response.json();
    return data as WorldBuildingNote;
  } catch (error) {
    console.error("Error in getWorldBuildingNote:", error);
    throw error;
  }
}

export async function createWorldBuildingNote(
  projectId: string,
  noteData: WorldBuildingNoteFormValues
): Promise<WorldBuildingNote> {
  try {
    // Validate with Zod before sending - API will also validate
    const validatedData = worldBuildingNoteBaseSchema.parse(noteData);
    
    const cookieHeader = await getCookieHeader();
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/world-notes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...cookieHeader,
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Failed to create world building note: ${response.status} ${response.statusText}`, errorData);
      throw new Error(
        `Failed to create world building note: ${response.status} ${
          response.statusText
        } - ${errorData.error || errorData.details || "Unknown error"}`
      );
    }
    const data = await response.json();
    return data as WorldBuildingNote;
  } catch (error) {
    console.error("Error in createWorldBuildingNote:", error);
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export async function updateWorldBuildingNote(
  projectId: string,
  noteId: string,
  noteData: Partial<WorldBuildingNoteFormValues>
): Promise<WorldBuildingNote> {
  try {
    // Partial validation - API will do full validation
    const validatedData = worldBuildingNoteBaseSchema.partial().parse(noteData);
    
    const cookieHeader = await getCookieHeader();
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/world-notes/${noteId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...cookieHeader,
        },
        body: JSON.stringify(validatedData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Failed to update world building note: ${response.status} ${response.statusText}`, errorData);
      throw new Error(
        `Failed to update world building note: ${response.status} ${
          response.statusText
        } - ${errorData.error || errorData.details || "Unknown error"}`
      );
    }
    const data = await response.json();
    return data as WorldBuildingNote;
  } catch (error) {
    console.error("Error in updateWorldBuildingNote:", error);
     if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export async function deleteWorldBuildingNote(
  projectId: string,
  noteId: string
): Promise<void> {
  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(
      `${API_BASE_URL}/api/projects/${projectId}/world-notes/${noteId}`,
      {
        method: "DELETE",
        headers: {
          ...cookieHeader,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
      console.error(`Failed to delete world building note: ${response.status} ${response.statusText}`, errorData);
      throw new Error(
        `Failed to delete world building note: ${response.status} ${
          response.statusText
        } - ${errorData.error || "Unknown error"}`
      );
    }
    // No content expected on successful delete
  } catch (error) {
    console.error("Error in deleteWorldBuildingNote:", error);
    throw error;
  }
}
