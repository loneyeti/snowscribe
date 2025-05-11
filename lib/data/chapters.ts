import type { Chapter } from "@/lib/types";
import { countWords } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server"; // Import Supabase server client

export async function getChaptersByProjectId(projectId: string): Promise<Chapter[]> {
  const supabase = await createClient();

  // Get current user to ensure authenticated access and for project ownership check
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Unauthorized attempt to fetch chapters for project ${projectId} in lib/data/chapters.ts:`, userError?.message);
    return [];
  }

  // Verify that the project exists and belongs to the authenticated user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    console.error(`Project not found or access denied for project ${projectId} in lib/data/chapters.ts:`, projectFetchError?.message);
    return [];
  }

  // Fetch chapters directly from the database
  const { data: chaptersFromDb, error: chaptersError } = await supabase
    .from('chapters')
    .select('*, scenes(id, content)') // Fetch scenes (id and content) along with chapters
    .eq('project_id', projectId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (chaptersError) {
    console.error(`Error fetching chapters from DB for project ${projectId}:`, chaptersError.message);
    return [];
  }

  if (!chaptersFromDb) {
    return []; // No chapters found, or an unexpected issue
  }

  // Process chapters to add word_count and scene_count
  const processedChapters = chaptersFromDb.map(chapter => {
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
