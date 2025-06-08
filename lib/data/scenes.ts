"use server";

import type { Scene } from "@/lib/types";
import type { UpdateSceneValues } from "@/lib/schemas/scene.schema";
import { getCookieHeader } from "./dataUtils";

// This function is designed to be called from Client Components,
// so it will use `fetch` directly.
// If we need a server-side version (e.g., for initial props in page.tsx),
// we'd create a separate function or adapt this one.
export async function getScenesByChapterId(
  projectId: string,
  chapterId: string
): Promise<Scene[]> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
    return [];
  }

  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(
      `${appUrl}/api/projects/${projectId}/chapters/${chapterId}/scenes`,
      {
        cache: "no-store",
        headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
      }
    );

    if (!response.ok) {
      console.error(
        `Error fetching scenes for chapter ${chapterId}: ${response.status} ${response.statusText}`
      );
      return [];
    }
    return response.json();
  } catch (error) {
    console.error(`Network or other error fetching scenes for chapter ${chapterId}:`, error);
    return [];
  }
}

// Update a scene (PUT)
// This function aligns with the API route at /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
// and the Zod schema for updateSceneSchema.
export async function updateScene(
  projectId: string,
  chapterId: string,
  sceneId: string,
  data: UpdateSceneValues
): Promise<Scene> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
  }
  const cookieHeader = await getCookieHeader();

  const response = await fetch(
    `${appUrl}/api/projects/${projectId}/chapters/${chapterId}/scenes/${sceneId}`,
    {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let errorMsg = "Failed to update scene.";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// Update scene characters (many-to-many, via join table)
// Calls /api/projects/[projectId]/scenes/[sceneId]/characters (PUT)
export async function updateSceneCharacters(
  projectId: string,
  sceneId: string,
  characterIds: string[]
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
  }

  const cookieHeader = await getCookieHeader();

  const response = await fetch(
    `${appUrl}/api/projects/${projectId}/scenes/${sceneId}/characters`,
    {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
      body: JSON.stringify({ characterIds }),
    }
  );

  if (!response.ok) {
    let errorMsg = "Failed to update scene characters.";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
}

// Update scene tags (many-to-many, via join table)
// Calls /api/projects/[projectId]/scenes/[sceneId]/tags (PUT)
export async function updateSceneTags(
  projectId: string,
  sceneId: string,
  tagIds: string[]
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
  }

  const cookieHeader = await getCookieHeader();

  const response = await fetch(
    `${appUrl}/api/projects/${projectId}/scenes/${sceneId}/tags`,
    {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
      body: JSON.stringify({ tagIds }),
    }
  );

  if (!response.ok) {
    let errorMsg = "Failed to update scene tags.";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
}
