import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSceneSchema } from '@/lib/schemas/scene.schema';
import type { Scene } from '@/lib/types';
import { withSceneAuth } from '@/lib/api/utils';

interface SceneParams {
  projectId: string;
  chapterId: string;
  sceneId: string;
}

interface SceneWithChapterAndProjectForFiltering extends Scene {
  chapters: {
    project_id: string;
  };
}

export async function GET(request: Request, { params }: { params: SceneParams }) {
  return withSceneAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: sceneQueryResult, error: sceneError } = await supabase
      .from('scenes')
      .select(`
        *,
        chapters!inner (
          project_id
        )
      `)
      .eq('id', p.sceneId)
      .eq('chapter_id', p.chapterId)
      .eq('chapters.project_id', p.projectId)
      .single<SceneWithChapterAndProjectForFiltering>();

    if (sceneError || !sceneQueryResult) {
      console.error(`Error fetching scene ${p.sceneId}: ${sceneError?.message}`);
      return NextResponse.json(
        { error: 'Scene not found or access denied' }, 
        { status: 404 }
      );
    }

    const { chapters, ...sceneData } = sceneQueryResult; // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(sceneData);
  });
}

export async function PUT(request: Request, { params }: { params: SceneParams }) {
  return withSceneAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = updateSceneSchema.safeParse(jsonData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    if (Object.keys(validationResult.data).length === 0) {
      const { data: existingScene } = await supabase
        .from('scenes')
        .select('*')
        .eq('id', p.sceneId)
        .single();
      return NextResponse.json(existingScene);
    }

    const { error: updateError } = await supabase
      .from('scenes')
      .update(validationResult.data)
      .eq('id', p.sceneId);

    if (updateError) {
      console.error(`Error updating scene ${p.sceneId}:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update scene', details: updateError.message },
        { status: 500 }
      );
    }

    const { data: fullUpdatedScene, error: fetchUpdatedError } = await supabase
      .from('scenes')
      .select(`
        *,
        scene_characters(character_id),
        scene_applied_tags(tag_id)
      `)
      .eq('id', p.sceneId)
      .single();

    if (fetchUpdatedError) {
      console.error(`Error re-fetching scene ${p.sceneId}:`, fetchUpdatedError);
      return NextResponse.json(
        { error: 'Scene updated but failed to fetch complete data', details: fetchUpdatedError.message },
        { status: 500 }
      );
    }

    const sceneWithRawRelations = fullUpdatedScene as Omit<Scene, 'other_character_ids' | 'tag_ids'> & {
      scene_characters: { character_id: string }[] | null;
      scene_applied_tags: { tag_id: string }[] | null;
    };

    const finalScene: Scene = {
      ...sceneWithRawRelations,
      other_character_ids: (sceneWithRawRelations.scene_characters || []).map(sc => sc.character_id),
      tag_ids: (sceneWithRawRelations.scene_applied_tags || []).map(sat => sat.tag_id),
    };

    delete (finalScene as unknown as { scene_characters?: unknown }).scene_characters;
    delete (finalScene as unknown as { scene_applied_tags?: unknown }).scene_applied_tags;

    return NextResponse.json(finalScene);
  });
}

export async function DELETE(request: Request, { params }: { params: SceneParams }) {
  return withSceneAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from('scenes')
      .delete()
      .eq('id', p.sceneId);

    if (deleteError) {
      console.error(`Error deleting scene ${p.sceneId}:`, deleteError);
      return NextResponse.json(
        { error: 'Failed to delete scene', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Scene deleted successfully' }, { status: 200 });
  });
}
