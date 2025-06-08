import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
import { updateSceneSchema } from '@/lib/schemas/scene.schema';
import type { Scene } from '@/lib/types'; // Import the Scene type

// Define the expected shape of the data from the join for chapter and project validation
interface SceneWithChapterAndProjectForFiltering extends Scene {
  chapters: { // !inner join implies chapter must exist
    project_id: string; // project_id from the chapter
    // No need to join to projects table here if verifyProjectOwnership is used first
  };
}

interface SceneParams {
  projectId: string;
  chapterId: string;
  sceneId: string;
}

// GET /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function GET(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = await params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // 2. Verify scene belongs to the chapter and the chapter belongs to the (now verified) project
  const { data: sceneQueryResult, error: sceneError } = await supabase
    .from('scenes')
    .select(`
      *,
      chapters!inner (
        project_id
      )
    `)
    .eq('id', sceneId)
    .eq('chapter_id', chapterId)
    .eq('chapters.project_id', projectId) // Ensure chapter is part of the verified project
    .single<SceneWithChapterAndProjectForFiltering>();

  if (sceneError || !sceneQueryResult) {
    console.error(`Error fetching scene ${sceneId} (or not found/access denied after project verification): ${sceneError?.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied within this project/chapter' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { chapters, ...sceneData } = sceneQueryResult; // Strip the joined chapters data for the response
  return NextResponse.json(sceneData);
}

// PUT /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function PUT(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = await params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed with scene update logic
  let jsonData;
  try {
    jsonData = await request.json();
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

  // 2. Verify scene exists within the specified chapter and (now verified) project
  const { data: existingScene, error: fetchError } = await supabase
    .from('scenes')
    .select(`
      id,
      chapters!inner (
        project_id
      )
    `)
    .eq('id', sceneId)
    .eq('chapter_id', chapterId)
    .eq('chapters.project_id', projectId) // Ensure chapter is part of the verified project
    .single();

  if (fetchError || !existingScene) {
    console.error(`Pre-flight check failed for PUT /api/projects/.../scenes/${sceneId}: sceneId=${sceneId}, chapterId=${chapterId}, projectId=${projectId}. Error: ${fetchError?.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied for update within this project/chapter' }, { status: 404 });
  }

  // If existingScene is found, proceed with the update
  if (Object.keys(validationResult.data).length === 0) {
    // No fields to update, return existing scene as is
    return NextResponse.json(existingScene);
  }

  // Step 1: Perform the update. We don't need to select data here.
  const { error: updateError } = await supabase
    .from('scenes')
    .update(validationResult.data)
    .eq('id', sceneId);

  if (updateError) {
    console.error(`Error updating scene ${sceneId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update scene', details: updateError.message }, { status: 500 });
  }

  // Step 2: After a successful update, re-fetch the scene with all its relations.
  const { data: fullUpdatedScene, error: fetchUpdatedError } = await supabase
    .from('scenes')
    .select(`
      *,
      scene_characters(character_id),
      scene_applied_tags(tag_id)
    `)
    .eq('id', sceneId)
    .single();

  if (fetchUpdatedError) {
    console.error(`Error re-fetching scene ${sceneId} after update:`, fetchUpdatedError);
    return NextResponse.json({ error: 'Scene updated, but failed to fetch complete data.', details: fetchUpdatedError.message }, { status: 500 });
  }

  if (!fullUpdatedScene) {
    return NextResponse.json({ error: 'Updated scene not found.' }, { status: 404 });
  }

  // Step 3: Process the fetched data to flatten relations into arrays.
  // This ensures the returned object has the same shape the client-side expects.
  const sceneWithRawRelations = fullUpdatedScene as Omit<Scene, 'other_character_ids' | 'tag_ids'> & {
    scene_characters: { character_id: string }[] | null;
    scene_applied_tags: { tag_id: string }[] | null;
  };

  const finalScene: Scene = {
    ...sceneWithRawRelations,
    other_character_ids: (sceneWithRawRelations.scene_characters || []).map(sc => sc.character_id),
    tag_ids: (sceneWithRawRelations.scene_applied_tags || []).map(sat => sat.tag_id),
  };

  // Define a type for the scene with temporary relation properties
  type SceneWithTempRelations = Scene & {
    scene_characters?: { character_id: string }[];
    scene_applied_tags?: { tag_id: string }[];
  };

  // Clean up temporary relation properties before sending the response.
  delete (finalScene as SceneWithTempRelations).scene_characters;
  delete (finalScene as SceneWithTempRelations).scene_applied_tags;

  // Step 4: Return the fully-formed scene object.
  return NextResponse.json(finalScene);
}

// DELETE /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function DELETE(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = await params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // 2. Verify scene exists within the specified chapter and (now verified) project before deleting
  const { data: existingSceneForDelete, error: fetchErrorForDelete } = await supabase
    .from('scenes')
    .select(`
      id,
      chapters!inner (
        project_id
      )
    `)
    .eq('id', sceneId)
    .eq('chapter_id', chapterId)
    .eq('chapters.project_id', projectId) // Ensure chapter is part of the verified project
    .single();

  if (fetchErrorForDelete || !existingSceneForDelete) {
    console.error(`Pre-flight check failed for DELETE /api/projects/.../scenes/${sceneId}: sceneId=${sceneId}, chapterId=${chapterId}, projectId=${projectId}. Error: ${fetchErrorForDelete?.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied for deletion within this project/chapter' }, { status: 404 });
  }

  // If scene exists and all checks passed, proceed with deletion
  const { error: deleteError } = await supabase
    .from('scenes')
    .delete()
    .eq('id', sceneId); // Only need to match by sceneId for the delete

  if (deleteError) {
    console.error(`Error deleting scene ${sceneId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete scene', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Scene deleted successfully' }, { status: 200 });
}
