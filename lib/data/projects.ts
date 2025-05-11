import type { Project, Genre } from "@/lib/types";
import { getChaptersByProjectId } from "./chapters"; // Import the function to get chapters
import { createClient } from "@/lib/supabase/server"; // Import Supabase server client

export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null }) | null> {
  const supabase = await createClient();

  // Get current user to ensure authenticated access and for project ownership check
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Unauthorized attempt to fetch project ${projectId} in lib/data/projects.ts:`, userError?.message);
    return null;
  }

  // Fetch project directly from the database, including genre data
  // Also verify ownership by checking user_id
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`
      *,
      genres (
        id,
        name,
        created_at
      )
    `)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError) {
    console.error(`Error fetching project ${projectId} from DB:`, projectError.message);
    if (projectError.code === 'PGRST116') { // Code for "Not a single row was found"
      return null; // Project not found or access denied
    }
    return null; // Other error
  }

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
