import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withProjectAuth } from '@/lib/api/utils';
import { z } from 'zod';

interface SceneTagParams {
  projectId: string;
  sceneId: string;
}

const updateSceneTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

export async function PUT(request: Request, { params }: { params: SceneTagParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    // Verify scene exists and belongs to the project
    const { data: sceneData, error: sceneError } = await supabase
      .from('scenes')
      .select('id, chapter_id')
      .eq('id', p.sceneId)
      .single();

    if (sceneError || !sceneData) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
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

    const validationResult = updateSceneTagsSchema.safeParse(jsonData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { tagIds } = validationResult.data;

    // Delete existing scene_applied_tags for this scene
    const { error: deleteError } = await supabase
      .from('scene_applied_tags')
      .delete()
      .eq('scene_id', p.sceneId);

    if (deleteError) {
      console.error(`Error deleting scene_applied_tags for scene ${p.sceneId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to update scene tags (delete step)', details: deleteError.message }, { status: 500 });
    }

    // Insert new scene_applied_tags if any tagIds are provided
    if (tagIds.length > 0) {
      const newSceneTags = tagIds.map(tagId => ({
        scene_id: p.sceneId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from('scene_applied_tags')
        .insert(newSceneTags);

      if (insertError) {
        console.error(`Error inserting new scene_applied_tags for scene ${p.sceneId}:`, insertError);
        return NextResponse.json({ error: 'Failed to update scene tags (insert step)', details: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Scene tags updated successfully', sceneId: p.sceneId, tagIds }, { status: 200 });
  });
}
