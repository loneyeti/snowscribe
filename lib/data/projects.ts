import { cookies } from "next/headers";
import type { Project, Genre } from "@/lib/types";
import { getChaptersByProjectId } from "./chapters"; // Import the function to get chapters

export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null }) | null> {
  const cookieStore = await cookies(); // Await cookies()
  // Ensure NEXT_PUBLIC_APP_URL is set in your environment variables
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
    // Depending on strictness, you might throw an error or return null
    // For now, returning null to allow the caller to handle it (e.g., with notFound())
    return null;
  }

  const response = await fetch(`${appUrl}/api/projects/${projectId}`, {
    headers: {
      Cookie: cookieStore.toString(), // Forward cookies for authentication
    },
    cache: "no-store", // Or configure caching as needed, e.g., 'force-cache' or revalidate options
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Project not found
    }
    // Log other errors but still return null to let the page handle with notFound() or an error message
    console.error(`Error fetching project ${projectId}: ${response.status} ${response.statusText}`);
    return null;
  }
  
  const projectData = await response.json() as (Project & { genres: Genre | null });

  if (!projectData) {
    return null;
  }

  // Calculate total word count for the project
  let totalWordCount = 0;
  try {
    const chapters = await getChaptersByProjectId(projectId);
    if (chapters && chapters.length > 0) {
      totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    }
  } catch (error) {
    console.error(`Error calculating total word count for project ${projectId}:`, error);
    // Proceed with project data but word count will be 0 or undefined based on type
  }

  return {
    ...projectData,
    wordCount: totalWordCount,
  };
}
