import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChapterSchema } from '@/lib/schemas/chapter.schema';
import { countWords } from '@/lib/utils';
import type { Chapter as ChapterType, Scene as SceneType } from '@/lib/types';
import { withProjectAuth } from '@/lib/api/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: chaptersFromDb, error: chaptersError } = await supabase
      .from('chapters')
      .select('*, scenes(*, scene_characters(character_id), scene_applied_tags(tag_id))')
      .eq('project_id', p.projectId)
      .order('order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (chaptersError) {
      console.error(`Error fetching chapters for project ${p.projectId}:`, chaptersError);
      return NextResponse.json({ error: 'Failed to fetch chapters', details: chaptersError.message }, { status: 500 });
    }

    if (!chaptersFromDb) {
      return NextResponse.json([]);
    }

    const processedChapters = chaptersFromDb.map(chapter_raw => {
      const chapterWithRawScenes = chapter_raw as Omit<ChapterType, 'word_count' | 'scene_count' | 'scenes'> & {
        scenes: (Omit<SceneType, 'other_character_ids' | 'tag_ids' | 'word_count'> & {
          scene_characters: { character_id: string }[];
          scene_applied_tags: { tag_id: string }[];
        })[] | null;
      };

      let chapterWordCount = 0;
      const processedScenes: SceneType[] = (chapterWithRawScenes.scenes || []).map(rawScene => {
        const sceneWordCount = countWords(rawScene.content);
        chapterWordCount += sceneWordCount;
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
          word_count: sceneWordCount,
          other_character_ids: (rawScene.scene_characters || []).map(sc => sc.character_id),
          tag_ids: (rawScene.scene_applied_tags || []).map(sat => sat.tag_id),
        };
      });

      const chapterSceneCount = processedScenes.length;
      const finalChapter: ChapterType = {
        id: chapterWithRawScenes.id,
        project_id: chapterWithRawScenes.project_id,
        title: chapterWithRawScenes.title,
        order: chapterWithRawScenes.order,
        created_at: chapterWithRawScenes.created_at,
        updated_at: chapterWithRawScenes.updated_at,
        word_count: chapterWordCount,
        scene_count: chapterSceneCount,
        scenes: processedScenes,
      };
      return finalChapter;
    });

    return NextResponse.json(processedChapters);
  });
}

export async function POST(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const dataToValidate = { ...jsonData, project_id: p.projectId };
    const validationResult = createChapterSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, description } = validationResult.data;
    let order = validationResult.data.order;

    if (order === undefined) {
      const { data: maxOrderChapter, error: orderError } = await supabase
        .from('chapters')
        .select('order')
        .eq('project_id', p.projectId)
        .order('order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error(`Error fetching max order for project ${p.projectId}:`, orderError);
        order = 0;
      } else if (maxOrderChapter) {
        order = maxOrderChapter.order + 1;
      } else {
        order = 0;
      }
    }

    const { data: newChapter, error: insertError } = await supabase
      .from('chapters')
      .insert({
        project_id: p.projectId,
        title,
        description,
        order,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating chapter for project ${p.projectId}:`, insertError);
      return NextResponse.json({ error: 'Failed to create chapter', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newChapter, { status: 201 });
  });
}
