// app/api/projects/[projectId]/chapters/[chapterId]/scenes/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards';
import { createSceneSchema } from '@/lib/schemas/scene.schema';
import type { Scene as SceneType } from '@/lib/types'; // Import SceneType

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

  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: chapter, error: chapterFetchError } = await supabase
    .from('chapters')
    .select('id, project_id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .single();

  if (chapterFetchError || !chapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
  }

  // MODIFICATION START: Fetch scenes with related character and tag IDs
  const { data: scenesFromDb, error: scenesError } = await supabase
    .from('scenes')
    .select(`
      *, 
      scene_characters(character_id), 
      scene_applied_tags(tag_id)
    `) // Fetch related IDs
    .eq('chapter_id', chapterId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (scenesError) {
    console.error(`Error fetching scenes for chapter ${chapterId}:`, scenesError);
    return NextResponse.json({ error: 'Failed to fetch scenes', details: scenesError.message }, { status: 500 });
  }

  if (!scenesFromDb) {
    return NextResponse.json([]);
  }

  // Process scenes to add other_character_ids and tag_ids
  const processedScenes = scenesFromDb.map(scene_raw => {
    const sceneWithRawRelations = scene_raw as Omit<SceneType, 'other_character_ids' | 'tag_ids'> & {
      scene_characters: { character_id: string }[] | null;
      scene_applied_tags: { tag_id: string }[] | null;
    };

    // Ensure all fields from scene_raw are spread, then overwrite with processed arrays
    const finalScene: SceneType = {
      ...scene_raw, // Spread all direct fields from scene_raw (id, title, content, order, etc.)
      id: scene_raw.id, // Explicitly include id if not covered by spread or to ensure type
      chapter_id: scene_raw.chapter_id, // Explicitly include
      title: scene_raw.title,
      content: scene_raw.content,
      word_count: scene_raw.word_count,
      order: scene_raw.order,
      notes: scene_raw.notes,
      outline_description: scene_raw.outline_description,
      pov_character_id: scene_raw.pov_character_id,
      primary_category: scene_raw.primary_category,
      created_at: scene_raw.created_at,
      updated_at: scene_raw.updated_at,
      other_character_ids: (sceneWithRawRelations.scene_characters || []).map(sc => sc.character_id),
      tag_ids: (sceneWithRawRelations.scene_applied_tags || []).map(sat => sat.tag_id),
    };
    return finalScene;
  });
  // MODIFICATION END

  return NextResponse.json(processedScenes);
}

// POST handler remains the same
export async function POST(request: Request, { params }: { params: ChapterSceneParams }) {
  // ... (existing POST logic)
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

  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: chapter, error: chapterFetchError } = await supabase
    .from('chapters')
    .select('id, project_id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
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
  let order = validationResult.data.order; 

  if (order === undefined) {
    const { data: maxOrderScene, error: orderError } = await supabase
      .from('scenes')
      .select('order')
      .eq('chapter_id', chapterId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle(); 

    if (orderError) {
      console.error(`Error fetching max order for scenes in chapter ${chapterId}:`, orderError);
      order = 0;
    } else if (maxOrderScene) {
      order = maxOrderScene.order + 1;
    } else {
      order = 0; 
    }
  }

  const { data: newScene, error: insertError } = await supabase
    .from('scenes')
    .insert({
      chapter_id: chapterId,
      title,
      content,
      order,
      primary_category: validationResult.data.primary_category,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating scene for chapter ${chapterId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create scene', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newScene, { status: 201 });
}