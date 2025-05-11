import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards';
import { z } from 'zod';

interface SceneCharacterParams {
  projectId: string;
  sceneId: string;
}

const updateSceneCharactersSchema = z.object({
  characterIds: z.array(z.string().uuid()),
});

// PUT /api/projects/[projectId]/scenes/[sceneId]/characters
export async function PUT(request: Request, { params }: { params: SceneCharacterParams }) {
  const { projectId, sceneId } = await params;

  if (!projectId || !sceneId) {
    return NextResponse.json({ error: 'Project ID and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership (and implicitly that the project exists)
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // Verify scene exists and belongs to the project
  const { data: sceneData, error: sceneError } = await supabase
    .from('scenes')
    .select('id, chapter_id')
    .eq('id', sceneId)
    .single();

  if (sceneError || !sceneData) {
    return NextResponse.json({ error: 'Scene not found or error fetching scene' }, { status: 404 });
  }

  const { data: chapterData, error: chapterError } = await supabase
    .from('chapters')
    .select('project_id')
    .eq('id', sceneData.chapter_id)
    .single();

  if (chapterError || !chapterData || chapterData.project_id !== projectId) {
    return NextResponse.json({ error: 'Scene does not belong to the specified project' }, { status: 403 });
  }
  
  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = updateSceneCharactersSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { characterIds } = validationResult.data;

  // Perform operations in a transaction
  // Note: Supabase JS client doesn't directly support transactions like `BEGIN...COMMIT`.
  // We'll perform operations sequentially and rely on application logic for atomicity,
  // or use a database function (stored procedure) if true atomicity is critical.
  // For this use case, sequential delete then insert is generally acceptable.

  // 1. Delete existing scene_characters for this scene
  const { error: deleteError } = await supabase
    .from('scene_characters')
    .delete()
    .eq('scene_id', sceneId);

  if (deleteError) {
    console.error(`Error deleting scene_characters for scene ${sceneId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to update scene characters (delete step)', details: deleteError.message }, { status: 500 });
  }

  // 2. Insert new scene_characters if any characterIds are provided
  if (characterIds.length > 0) {
    const newSceneCharacters = characterIds.map(characterId => ({
      scene_id: sceneId,
      character_id: characterId,
    }));

    const { error: insertError } = await supabase
      .from('scene_characters')
      .insert(newSceneCharacters);

    if (insertError) {
      console.error(`Error inserting new scene_characters for scene ${sceneId}:`, insertError);
      // Potentially, we might want to re-insert the old ones if this fails,
      // but that adds complexity. For now, return an error.
      return NextResponse.json({ error: 'Failed to update scene characters (insert step)', details: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Scene characters updated successfully', sceneId, characterIds }, { status: 200 });
}
