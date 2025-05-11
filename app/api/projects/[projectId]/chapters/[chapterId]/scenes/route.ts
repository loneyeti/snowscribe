import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSceneSchema } from '@/lib/schemas/scene.schema';

interface ChapterSceneParams {
  projectId: string;
  chapterId: string;
}

// GET /api/projects/[projectId]/chapters/[chapterId]/scenes
export async function GET(request: Request, { params }: { params: ChapterSceneParams }) {
  const { projectId, chapterId } = await params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/chapters/${chapterId}/scenes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the chapter (and implicitly the project via user_id on chapter) exists and belongs to the user
  const { data: chapter, error: chapterFetchError } = await supabase
    .from('chapters')
    .select('id, project_id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    // RLS policy on chapters table ensures user owns the project associated with this chapter
    .single();

  if (chapterFetchError || !chapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
  }

  const { data: scenes, error: scenesError } = await supabase
    .from('scenes')
    .select('*')
    .eq('chapter_id', chapterId)
    // .eq('project_id', projectId) // Technically redundant if chapter check is solid, but good for safety
    // .eq('user_id', user.id) // Also redundant if chapter check is solid
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (scenesError) {
    console.error(`Error fetching scenes for chapter ${chapterId}:`, scenesError);
    return NextResponse.json({ error: 'Failed to fetch scenes', details: scenesError.message }, { status: 500 });
  }

  return NextResponse.json(scenes);
}

// POST /api/projects/[projectId]/chapters/[chapterId]/scenes
export async function POST(request: Request, { params }: { params: ChapterSceneParams }) {
  const { projectId, chapterId } = await params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/chapters/${chapterId}/scenes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the chapter (and implicitly the project) exists and belongs to the user
  const { data: chapter, error: chapterFetchError } = await supabase
    .from('chapters')
    .select('id, project_id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    // RLS policy on chapters table ensures user owns the project associated with this chapter
    .single();

  if (chapterFetchError || !chapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied for creating scene' }, { status: 404 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const dataToValidate = { ...jsonData, chapter_id: chapterId, project_id: projectId };
  const validationResult = createSceneSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { title, content } = validationResult.data;
  let order = validationResult.data.order; // order can be reassigned

  if (order === undefined) {
    // If order is not provided, calculate the next order value for this chapter
    const { data: maxOrderScene, error: orderError } = await supabase
      .from('scenes')
      .select('order')
      .eq('chapter_id', chapterId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to handle no scenes existing

    if (orderError) {
      console.error(`Error fetching max order for scenes in chapter ${chapterId}:`, orderError);
      // Fallback or error handling strategy. For now, default to 0 if error.
      order = 0;
    } else if (maxOrderScene) {
      order = maxOrderScene.order + 1;
    } else {
      order = 0; // This is the first scene for the chapter
    }
  }

  const { data: newScene, error: insertError } = await supabase
    .from('scenes')
    .insert({
      chapter_id: chapterId,
      // project_id is implicitly linked via chapter_id
      // user_id is implicitly linked via chapter_id -> project_id
      title,
      content,
      order,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating scene for chapter ${chapterId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create scene', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newScene, { status: 201 });
}
