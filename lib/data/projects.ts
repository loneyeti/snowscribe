import type { Project, Genre } from "@/lib/types";
import { getCookieHeader } from "./dataUtils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null; wordCount: number }) | null> {
  if (!projectId) {
    console.error("getProjectById called with no projectId");
    return null;
  }

  const apiUrl = `${API_BASE_URL}/api/projects/${projectId}`;

  try {
    // Log the outgoing fetch request details
    console.log(`[getProjectById] Fetching URL: ${apiUrl}`);
    console.log(`[getProjectById] Fetching Method: GET`);

    // Get cookies from the incoming request
    const cookieHeader = await getCookieHeader();

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }), // Conditionally add Cookie header
      },
    });

    // console.log(`[getProjectById] Response Status: ${response.status} ${response.statusText}`);
    // console.log(`[getProjectById] Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        errorBody = await response.text();
      } catch { /* ignore */ }
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

export async function deleteProject(projectId: string): Promise<void> {
  if (!projectId) {
    console.error("deleteProject called with no projectId");
    throw new Error("Project ID is required to delete a project.");
  }

  const apiUrl = `${API_BASE_URL}/api/projects/${projectId}`;
  const cookieHeader = await getCookieHeader();

  try {
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        // 'Content-Type': 'application/json', // Not typically needed for DELETE with no body
        ...(cookieHeader && { 'Cookie': cookieHeader }),
      },
    });

    if (!response.ok) {
      let errorBody = 'Could not read error body';
      try {
        // Attempt to parse error response if API sends one
        const errorData = await response.json();
        errorBody = errorData.error || errorData.message || JSON.stringify(errorData);
      } catch {
        // If parsing fails, use the status text
        errorBody = response.statusText;
      }
      console.error(`API error deleting project ${projectId} from ${apiUrl}: ${response.status} ${errorBody}`);
      throw new Error(`Failed to delete project: ${errorBody}`);
    }

    // DELETE request was successful, typically no body is returned or a simple success message
    // If your API returns a JSON message like { message: "Project deleted successfully" },
    // you can parse it, but it's often not necessary for a void return type.
    // console.log(`Project ${projectId} deleted successfully.`);

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Network or other error deleting project ${projectId} from ${apiUrl}:`, error.message);
      throw error; // Re-throw the caught error
    } else {
      console.error(`An unknown error occurred while deleting project ${projectId} from ${apiUrl}:`, error);
      throw new Error("An unknown error occurred during project deletion.");
    }
  }
}
