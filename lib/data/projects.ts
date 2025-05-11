import type { Project, Genre } from "@/lib/types";
import { cookies } from 'next/headers'; // Import cookies
// Note: getChaptersByProjectId is no longer needed here as word count is handled by the API route.
// Note: createClient for direct Supabase access is no longer needed here.

// Helper function to get the base URL for API calls
// This should ideally come from environment variables or a more robust config
function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // Fallback for local development if NEXT_PUBLIC_APP_URL is not set
  return 'http://localhost:3000';
}

export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null; wordCount: number }) | null> {
  if (!projectId) {
    console.error("getProjectById called with no projectId");
    return null;
  }

  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/projects/${projectId}`;

  try {
    // Log the outgoing fetch request details
    console.log(`[getProjectById] Fetching URL: ${apiUrl}`);
    console.log(`[getProjectById] Fetching Method: GET`);

    // Get cookies from the incoming request
    const cookieStore = await cookies(); // Re-add await based on TS error and activeContext.md
    const cookieHeader = cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
    });

    console.log(`[getProjectById] Response Status: ${response.status} ${response.statusText}`);
    console.log(`[getProjectById] Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
      } catch (e) { /* ignore */ }
      console.error(`API error fetching project ${projectId} from ${apiUrl}: ${response.status} ${response.statusText}. Body: ${errorBody.substring(0, 500)}`);
      return null; // Covers 404 and other non-ok statuses
    }

    // If response.ok, try to parse as JSON.
    // This is where the original error "Unexpected token '<'" would occur if HTML is received with a 200 OK.
    const responseText = await response.text();
    try {
      const projectData: (Project & { genres: Genre | null; wordCount: number }) = JSON.parse(responseText);
      // It's good practice to check if projectData is null or undefined even after successful parsing,
      // though typically if parse succeeds on valid JSON, it won't be null unless the JSON string was "null".
      if (projectData === null || projectData === undefined) {
         console.warn(`[getProjectById] Parsed JSON data is null or undefined for project ${projectId} from ${apiUrl}. Response text: ${responseText.substring(0,500)}`);
         return null;
      }
      return projectData;
    } catch (jsonParseError) {
      // Log the text that failed to parse, and the error.
      console.error(`[getProjectById] JSON Parse Error for project ${projectId} from ${apiUrl}. Received text: ${responseText.substring(0, 500)}...`, jsonParseError);
      return null;
    }

  } catch (networkError) {
    // This catch block handles network errors (e.g., DNS resolution, server unreachable)
    // or any other unexpected errors during the fetch process itself.
    if (networkError instanceof Error) {
      console.error(`[getProjectById] Network or other processing error for project ${projectId} from ${apiUrl}:`, networkError.message, networkError.stack);
    } else {
      console.error(`[getProjectById] An unknown network or processing error occurred for project ${projectId} from ${apiUrl}:`, networkError);
    }
    return null;
  }
}
