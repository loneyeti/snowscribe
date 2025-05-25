import type { Chapter } from "@/lib/types";
import { getCookieHeader } from "./dataUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function getChaptersByProjectId(projectId: string): Promise<Chapter[]> {
  if (!projectId) {
    console.error("getChaptersByProjectId called with no projectId");
    return [];
  }

  const apiUrl = `${API_BASE_URL}/api/projects/${projectId}/chapters`;

  try {
    const cookieHeader = await getCookieHeader();
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error(`API error fetching chapters for project ${projectId} from ${apiUrl}: ${response.status} ${response.statusText}`, errorData);
      return []; // Return empty array on error as per original function's behavior
    }

    const chaptersData: Chapter[] = await response.json();
    
    if (!chaptersData) {
      console.error(`No data returned for chapters of project ${projectId} from ${apiUrl}`);
      return [];
    }

    return chaptersData;

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Network or other error fetching chapters for project ${projectId} from ${apiUrl}:`, error.message);
    } else {
      console.error(`An unknown error occurred while fetching chapters for project ${projectId} from ${apiUrl}:`, error);
    }
    return []; // Return empty array on error
  }
}
