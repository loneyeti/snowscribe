import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSceneSchema } from '@/lib/schemas/scene.schema';
import type { Scene } from '@/lib/types'; // Import the Scene type

// Define the expected shape of the data from the join
interface SceneWithChaptersForFiltering extends Scene {
  chapters: {
    project_id: string;
    projects: {
      user_id: string;
    };
  };
}

interface SceneParams {
  projectId: string;
  chapterId: string;
  sceneId: string;
}

// GET /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function GET(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the scene, ensuring it matches the provided projectId, chapterId, sceneId, and user ownership
  // The join also allows us to verify the full path.
  const { data: sceneWithJoinedData, error: sceneError } = await supabase
    .from('scenes')
    .select(`
      *, // Selects all columns from the 'scenes' table
      chapters!inner ( // Ensures the chapter exists and is linked for filtering
        project_id,    // Needed for filtering by projectId
        projects!inner ( // Ensures the project exists and is linked for filtering
          user_id      // Needed for filtering by user.id
        )
      )
    `)
    .eq('id', sceneId)
    .eq('chapter_id', chapterId) // Match the chapter_id from the URL
    .eq('chapters.project_id', projectId) // Match the project_id from the URL via the joined chapter
    .eq('chapters.projects.user_id', user.id) // Match the user_id via the joined project
    .single<SceneWithChaptersForFiltering>(); // Specify the expected return type

  if (sceneError) {
    // Handles cases where the query fails or RLS prevents access before specific filters apply,
    // or if .single() doesn't find exactly one row (e.g., 0 rows due to filters).
    // PGRST116 is a common code for "zero rows" from .single().
    console.error(`Error fetching scene ${sceneId} for GET (or not found/access denied): ${sceneError.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied' }, { status: 404 });
  }

  // If sceneWithJoinedData is null but no error, it means the query executed but found no matching record.
  if (!sceneWithJoinedData) {
    return NextResponse.json({ error: 'Scene not found or access denied' }, { status: 404 });
  }

  // The result includes nested 'chapters' data due to the join.
  // We only want to return the scene's own fields.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { chapters, ...sceneData } = sceneWithJoinedData;

  return NextResponse.json(sceneData);
}

// PUT /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function PUT(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Verify scene exists and belongs to the user, chapter, and project before updating
  const { data: existingScene, error: fetchError } = await supabase
    .from('scenes')
    .select(`
      id,
      chapters!inner (
        project_id,
        projects!inner (
          user_id
        )
      )
    `)
    .eq('id', sceneId) // Check if scene with this ID exists
    .eq('chapter_id', chapterId) // And belongs to the chapter_id from the URL
    .eq('chapters.project_id', projectId) // And that chapter belongs to the project_id from the URL
    .eq('chapters.projects.user_id', user.id) // And that project belongs to the authenticated user
    .single();

  if (fetchError || !existingScene) {
    // If fetchError is not null, it could be a genuine DB error or RLS kicking in (though RLS should allow if conditions met)
    // If existingScene is null, it means no record matched all conditions.
    console.error(`Pre-flight check failed for PUT /api/projects/.../scenes/${sceneId}: sceneId=${sceneId}, chapterId=${chapterId}, projectId=${projectId}, userId=${user.id}. Error: ${fetchError?.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied for update' }, { status: 404 });
  }

  // If existingScene is found, it means all conditions (id, chapter_id, project_id via chapter, user_id via project) are met.
  // Now, we can update the scene.
  const { data: updatedScene, error: updateError } = await supabase
    .from('scenes')
    .update(validationResult.data)
    .eq('id', sceneId) // Only need to match by sceneId for the update, as ownership is verified.
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating scene ${sceneId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update scene', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedScene);
}

// DELETE /api/projects/[projectId]/chapters/[chapterId]/scenes/[sceneId]
export async function DELETE(request: Request, { params }: { params: SceneParams }) {
  const { projectId, chapterId, sceneId } = params;
  if (!projectId || !chapterId || !sceneId) {
    return NextResponse.json({ error: 'Project ID, Chapter ID, and Scene ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/.../scenes/${sceneId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify scene exists and belongs to the user, chapter, and project before deleting
  const { data: existingSceneForDelete, error: fetchErrorForDelete } = await supabase
    .from('scenes')
    .select(`
      id,
      chapters!inner (
        project_id,
        projects!inner (
          user_id
        )
      )
    `)
    .eq('id', sceneId) // Check if scene with this ID exists
    .eq('chapter_id', chapterId) // And belongs to the chapter_id from the URL
    .eq('chapters.project_id', projectId) // And that chapter belongs to the project_id from the URL
    .eq('chapters.projects.user_id', user.id) // And that project belongs to the authenticated user
    .single();

  if (fetchErrorForDelete || !existingSceneForDelete) {
    console.error(`Pre-flight check failed for DELETE /api/projects/.../scenes/${sceneId}: sceneId=${sceneId}, chapterId=${chapterId}, projectId=${projectId}, userId=${user.id}. Error: ${fetchErrorForDelete?.message}`);
    return NextResponse.json({ error: 'Scene not found or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('scenes')
    .delete()
    .eq('id', sceneId); // Only need to match by sceneId for the delete, as ownership is verified.

  if (deleteError) {
    console.error(`Error deleting scene ${sceneId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete scene', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Scene deleted successfully' }, { status: 200 });
}
