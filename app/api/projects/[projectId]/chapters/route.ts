import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
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

  // Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: chaptersFromDb, error: chaptersError } = await supabase
    .from('chapters')
    .select('*, scenes(*, scene_characters(character_id), scene_applied_tags(tag_id))') // Fetch all scene fields and related character/tag IDs
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

  // Process chapters to add word_count, scene_count, and fully structured scenes
  const processedChapters = chaptersFromDb.map(chapter_raw => {
    // Type for raw chapter data including raw scenes with related character/tag info
    const chapterWithRawScenes = chapter_raw as Omit<ChapterType, 'word_count' | 'scene_count' | 'scenes'> & {
      scenes: (Omit<SceneType, 'other_character_ids' | 'tag_ids' | 'word_count'> & {
        // All direct fields from scenes table are included via scenes(*)
        scene_characters: { character_id: string }[];
        scene_applied_tags: { tag_id: string }[];
      })[] | null;
    };

    let chapterWordCount = 0;
    const processedScenes: SceneType[] = (chapterWithRawScenes.scenes || []).map(rawScene => {
      const sceneWordCount = countWords(rawScene.content); // Calculate word count for the scene
      chapterWordCount += sceneWordCount; // Add to chapter's total word count

      // Ensure pov_character_id is correctly passed; it comes directly from rawScene
      // Ensure outline_description is correctly passed; it comes directly from rawScene
      return {
        id: rawScene.id,
        chapter_id: rawScene.chapter_id,
        title: rawScene.title,
        content: rawScene.content,
        order: rawScene.order,
        notes: rawScene.notes,
        outline_description: rawScene.outline_description,
        pov_character_id: rawScene.pov_character_id,
        created_at: rawScene.created_at,
        updated_at: rawScene.updated_at,
        word_count: sceneWordCount, // Assign calculated word_count
        other_character_ids: (rawScene.scene_characters || []).map(sc => sc.character_id),
        tag_ids: (rawScene.scene_applied_tags || []).map(sat => sat.tag_id),
      };
    });

    const chapterSceneCount = processedScenes.length;

    // Construct the final chapter object to match ChapterType, including processed scenes
    const finalChapter: ChapterType = {
      id: chapterWithRawScenes.id,
      project_id: chapterWithRawScenes.project_id,
      title: chapterWithRawScenes.title,
      order: chapterWithRawScenes.order,
      created_at: chapterWithRawScenes.created_at,
      updated_at: chapterWithRawScenes.updated_at,
      word_count: chapterWordCount,
      scene_count: chapterSceneCount,
      scenes: processedScenes, // Include the fully processed scenes array
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

  // Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
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
