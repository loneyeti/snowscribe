import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChapterSchema } from '@/lib/schemas/chapter.schema';
import { countWords } from '@/lib/utils'; // Import countWords utility
import type { Chapter as ChapterType, Scene as SceneType } from '@/lib/types'; // Import types

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/chapters
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/chapters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const { data: chaptersFromDb, error: chaptersError } = await supabase
    .from('chapters')
    .select('*, scenes(id, content)') // Fetch scenes (id and content) along with chapters
    .eq('project_id', projectId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (chaptersError) {
    console.error(`Error fetching chapters for project ${projectId}:`, chaptersError);
    return NextResponse.json({ error: 'Failed to fetch chapters', details: chaptersError.message }, { status: 500 });
  }

  if (!chaptersFromDb) {
    return NextResponse.json([]); // No chapters found or an unexpected issue
  }

  // Process chapters to add word_count and scene_count
  const processedChapters = chaptersFromDb.map(chapter => {
    // Explicitly type chapter to include scenes for processing
    const chapterWithScenes = chapter as Omit<ChapterType, 'word_count' | 'scene_count'> & { scenes: Pick<SceneType, 'id' | 'content'>[] | null };
    
    let chapterWordCount = 0;
    const chapterSceneCount = chapterWithScenes.scenes?.length || 0;

    if (chapterWithScenes.scenes) {
      for (const scene of chapterWithScenes.scenes) {
        chapterWordCount += countWords(scene.content);
      }
    }
    
    // Construct the final chapter object to match ChapterType
    const finalChapter: ChapterType = {
      id: chapterWithScenes.id,
      project_id: chapterWithScenes.project_id,
      title: chapterWithScenes.title,
      // description: chapterWithScenes.description, // Removed as it's not in ChapterType or DB
      order: chapterWithScenes.order,
      created_at: chapterWithScenes.created_at,
      updated_at: chapterWithScenes.updated_at,
      word_count: chapterWordCount,
      scene_count: chapterSceneCount,
      // scenes array is not part of the final ChapterType by default,
      // if it were, it should be added here.
      // For now, we only add calculated counts.
    };
    return finalChapter;
  });

  return NextResponse.json(processedChapters);
}

// POST /api/projects/[projectId]/chapters
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/chapters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied for creating chapter' }, { status: 404 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Add projectId to the data to be validated, as schema expects it but it's not in request body
  const dataToValidate = { ...jsonData, project_id: projectId };
  const validationResult = createChapterSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { title, description } = validationResult.data;
  let order = validationResult.data.order; // order can be reassigned

  if (order === undefined) {
    // If order is not provided, calculate the next order value
    const { data: maxOrderChapter, error: orderError } = await supabase
      .from('chapters')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to handle no chapters existing

    if (orderError) {
      console.error(`Error fetching max order for project ${projectId}:`, orderError);
      // Fallback or error handling strategy. For now, default to 0 if error.
      // Consider returning 500 if this query fails in a production scenario.
      order = 0;
    } else if (maxOrderChapter) {
      order = maxOrderChapter.order + 1;
    } else {
      order = 0; // This is the first chapter for the project
    }
  }

  const { data: newChapter, error: insertError } = await supabase
    .from('chapters')
    .insert({
      project_id: projectId, // Ensure chapter is linked to the correct project
      title,
      description,
      order, // Use the determined order
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating chapter for project ${projectId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create chapter', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newChapter, { status: 201 });
}
