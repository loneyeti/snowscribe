import type { Chapter } from "@/lib/types";
import { countWords } from "@/lib/utils";

export async function getChaptersByProjectId(projectId: string): Promise<Chapter[]> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set. API calls will fail.");
    return []; // Return empty array on configuration error
  }

  const response = await fetch(`${appUrl}/api/projects/${projectId}/chapters`, {
    cache: "no-store", // Or configure caching as needed
  });

  if (!response.ok) {
    // Log error but return empty array to allow the page to render gracefully
    console.error(`Error fetching chapters for project ${projectId}: ${response.status} ${response.statusText}`);
    return [];
  }
  
  const chaptersFromApi = await response.json() as Chapter[]; // API returns Chapter[] with nested scenes

  // Process chapters to add word_count and scene_count
  const processedChapters = chaptersFromApi.map(chapter => {
    let chapterWordCount = 0;
    const chapterSceneCount = chapter.scenes?.length || 0;

    if (chapter.scenes) {
      for (const scene of chapter.scenes) {
        chapterWordCount += countWords(scene.content);
      }
    }
    // Return a new object for the chapter, including the calculated counts
    // and ensure the original scenes array is not part of the final Chapter object if not needed,
    // or ensure the Chapter type correctly defines it.
    // For now, we assume the Chapter type can hold scenes if needed by UI,
    // but word_count and scene_count are the primary additions here.
    return {
      ...chapter,
      word_count: chapterWordCount,
      scene_count: chapterSceneCount,
    };
  });

  return processedChapters;
}
