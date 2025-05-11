import type { Chapter } from "@/lib/types";
import { cookies } from 'next/headers'; // Import cookies
// countWords and createClient are no longer needed here.

// Helper function to get the base URL for API calls
function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback for local development if NEXT_PUBLIC_APP_URL is not set
  return 'http://localhost:3000';
}

export async function getChaptersByProjectId(projectId: string): Promise<Chapter[]> {
  if (!projectId) {
    console.error("getChaptersByProjectId called with no projectId");
    return [];
  }

  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/projects/${projectId}/chapters`;

  try {
    // Get cookies from the incoming request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

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
