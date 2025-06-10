import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSceneSchema } from '@/lib/schemas/scene.schema';
import { withProjectAuth } from '@/lib/api/utils';
import type { Scene as SceneType } from '@/lib/types';

interface ChapterSceneParams {
  projectId: string;
  chapterId: string;
}

export async function GET(request: Request, { params }: { params: ChapterSceneParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: chapter, error: chapterFetchError } = await supabase
      .from('chapters')
      .select('id, project_id')
      .eq('id', p.chapterId)
      .eq('project_id', p.projectId)
      .single();

    if (chapterFetchError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
    }

    const { data: scenesFromDb, error: scenesError } = await supabase
      .from('scenes')
      .select(`
        *, 
        scene_characters(character_id), 
        scene_applied_tags(tag_id)
      `)
      .eq('chapter_id', p.chapterId)
      .order('order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (scenesError) {
      console.error(`Error fetching scenes for chapter ${p.chapterId}:`, scenesError);
      return NextResponse.json({ error: 'Failed to fetch scenes', details: scenesError.message }, { status: 500 });
    }

    if (!scenesFromDb) {
      return NextResponse.json([]);
    }

    const processedScenes = scenesFromDb.map(scene_raw => {
      const sceneWithRawRelations = scene_raw as Omit<SceneType, 'other_character_ids' | 'tag_ids'> & {
        scene_characters: { character_id: string }[] | null;
        scene_applied_tags: { tag_id: string }[] | null;
      };

      return {
        ...scene_raw,
        other_character_ids: (sceneWithRawRelations.scene_characters || []).map(sc => sc.character_id),
        tag_ids: (sceneWithRawRelations.scene_applied_tags || []).map(sat => sat.tag_id),
      };
    });

    return NextResponse.json(processedScenes);
  });
}

export async function POST(request: Request, { params }: { params: ChapterSceneParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: chapter, error: chapterFetchError } = await supabase
      .from('chapters')
      .select('id, project_id')
      .eq('id', p.chapterId)
      .eq('project_id', p.projectId)
      .single();

    if (chapterFetchError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found or access denied for creating scene' }, { status: 404 });
    }

    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const dataToValidate = { ...jsonData, chapter_id: p.chapterId, project_id: p.projectId };
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
        .eq('chapter_id', p.chapterId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error(`Error fetching max order for scenes in chapter ${p.chapterId}:`, orderError);
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
        chapter_id: p.chapterId,
        title,
        content,
        order,
        primary_category: validationResult.data.primary_category,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating scene for chapter ${p.chapterId}:`, insertError);
      return NextResponse.json({ error: 'Failed to create scene', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newScene, { status: 201 });
  });
}
