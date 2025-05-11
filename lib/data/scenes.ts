// import { cookies } from "next/headers"; // Removed as this is for client-side fetch
import type { Scene } from "@/lib/types";

// This function is designed to be called from Client Components,
// so it will use `fetch` directly.
// If we need a server-side version (e.g., for initial props in page.tsx),
// we'd create a separate function or adapt this one.
export async function getScenesByChapterId(
  projectId: string,
  chapterId: string
): Promise<Scene[]> {
  // Note: cookies() cannot be used directly in client-side fetched functions.
  // Authentication headers must be handled by the fetch call itself if this
  // function is called from the client-side.
  // For client-side calls, Supabase client instance (browser client) handles auth.
  // This function as-is implies it might be intended for server-side data aggregation
  // if it were to use the cookies() import.
  // However, ProjectDashboardClient is a client component, so direct fetch is fine,
  // but it won't automatically have auth cookies unless fetch is configured for it
  // or we use the Supabase JS client for the request.

  // For simplicity in this step, assuming the API endpoint is protected and
  // the browser's fetch will include necessary cookies for session-based auth.
  // A more robust solution for client-side fetching would use the Supabase JS client.

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
    return [];
  }

  try {
    const response = await fetch(
      `${appUrl}/api/projects/${projectId}/chapters/${chapterId}/scenes`,
      {
        // If your API relies on cookies set by Supabase SSR,
        // client-side fetch might not send them by default unless credentials:'include' is set
        // and CORS is configured correctly.
        // For Supabase, usually client-side calls are made with the Supabase JS client
        // which handles auth tokens.
        cache: "no-store", // Or configure caching as needed
      }
    );

    if (!response.ok) {
      console.error(
        `Error fetching scenes for chapter ${chapterId}: ${response.status} ${response.statusText}`
      );
      return []; // Return empty array on error
    }
    return response.json();
  } catch (error) {
    console.error(`Network or other error fetching scenes for chapter ${chapterId}:`, error);
    return [];
  }
}
