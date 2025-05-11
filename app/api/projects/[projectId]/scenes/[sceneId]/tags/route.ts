import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards';
import { z } from 'zod';

interface SceneTagParams {
  projectId: string;
  sceneId: string;
}

const updateSceneTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

// PUT /api/projects/[projectId]/scenes/[sceneId]/tags
export async function PUT(request: Request, { params }: { params: SceneTagParams }) {
  const { projectId, sceneId } = await params;

  if (!projectId || !sceneId) {
    return NextResponse.json({ error: 'Project ID and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership
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
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
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
    .eq('scene_id', sceneId);

  if (deleteError) {
    console.error(`Error deleting scene_applied_tags for scene ${sceneId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to update scene tags (delete step)', details: deleteError.message }, { status: 500 });
  }

  // Insert new scene_applied_tags if any tagIds are provided
  if (tagIds.length > 0) {
    const newSceneTags = tagIds.map(tagId => ({
      scene_id: sceneId,
      tag_id: tagId,
    }));

    const { error: insertError } = await supabase
      .from('scene_applied_tags')
      .insert(newSceneTags);

    if (insertError) {
      console.error(`Error inserting new scene_applied_tags for scene ${sceneId}:`, insertError);
      return NextResponse.json({ error: 'Failed to update scene tags (insert step)', details: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Scene tags updated successfully', sceneId, tagIds }, { status: 200 });
}
