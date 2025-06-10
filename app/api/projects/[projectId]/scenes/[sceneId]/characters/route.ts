import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withProjectAuth } from '@/lib/api/utils';
import { z } from 'zod';

interface SceneCharacterParams {
  projectId: string;
  sceneId: string;
}

const updateSceneCharactersSchema = z.object({
  characterIds: z.array(z.string().uuid()),
});

export async function PUT(request: Request, { params }: { params: SceneCharacterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    // Verify scene exists and belongs to the project
    const { data: sceneData, error: sceneError } = await supabase
      .from('scenes')
      .select('id, chapter_id')
      .eq('id', p.sceneId)
      .single();

    if (sceneError || !sceneData) {
      return NextResponse.json({ error: 'Scene not found or error fetching scene' }, { status: 404 });
    }

    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('project_id')
      .eq('id', sceneData.chapter_id)
      .single();

    if (chapterError || !chapterData || chapterData.project_id !== p.projectId) {
      return NextResponse.json({ error: 'Scene does not belong to the specified project' }, { status: 403 });
    }
    
    let jsonData;
    try {
      jsonData = await req.json();
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

    // 1. Delete existing scene_characters for this scene
    const { error: deleteError } = await supabase
      .from('scene_characters')
      .delete()
      .eq('scene_id', p.sceneId);

    if (deleteError) {
      console.error(`Error deleting scene_characters for scene ${p.sceneId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to update scene characters (delete step)', details: deleteError.message }, { status: 500 });
    }

    // 2. Insert new scene_characters if any characterIds are provided
    if (characterIds.length > 0) {
      const newSceneCharacters = characterIds.map(characterId => ({
        scene_id: p.sceneId,
        character_id: characterId,
      }));

      const { error: insertError } = await supabase
        .from('scene_characters')
        .insert(newSceneCharacters);

      if (insertError) {
        console.error(`Error inserting new scene_characters for scene ${p.sceneId}:`, insertError);
        return NextResponse.json({ error: 'Failed to update scene characters (insert step)', details: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Scene characters updated successfully', sceneId: p.sceneId, characterIds }, { status: 200 });
  });
}
