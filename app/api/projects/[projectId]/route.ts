import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
import { updateProjectSchema } from '@/lib/schemas/project.schema';

interface Params {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    // If the guard returns an error (e.g. project not found for user, or other issue)
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }
  // ownershipVerification.project contains { id: projectId } if successful

  // If ownership is verified, fetch the full project details
  const { data: projectData, error: projectFetchError } = await supabase
    .from('projects')
    .select(`
      *,
      genres (
        id,
        name,
        created_at
      )
    `)
    .eq('id', projectId)
    // .eq('user_id', user.id) // This is now covered by verifyProjectOwnership
    .single();

  if (projectFetchError || !projectData) {
    // This case should ideally be caught by verifyProjectOwnership if it's an ownership/existence issue.
    // However, if verifyProjectOwnership passed but this somehow fails (e.g. network issue during this specific query)
    console.error(`Error fetching full project details for ${projectId} after ownership verification:`, projectFetchError?.message);
    return NextResponse.json({ error: 'Failed to fetch full project details after verification', details: projectFetchError?.message }, { status: 500 });
  }

  // Calculate total word count for the project by summing scene word counts
  let totalWordCount = 0;
  try {
    // Step 1: Get all chapter IDs for the project
    const { data: projectChapters, error: projectChaptersError } = await supabase
      .from('chapters')
      .select('id')
      .eq('project_id', projectId);

    if (projectChaptersError) {
      console.error(`Error fetching chapter IDs for word count (GET) for project ${projectId}:`, projectChaptersError.message);
      // Proceed, totalWordCount will be 0
    } else if (projectChapters && projectChapters.length > 0) {
      const chapterIds = projectChapters.map(c => c.id);

      // Step 2: Get all scenes for these chapter IDs and sum their word_counts
      const { data: scenes, error: scenesError } = await supabase
        .from('scenes')
        .select('word_count') // Assuming scenes.word_count exists
        .in('chapter_id', chapterIds);

      if (scenesError) {
        console.error(`Error fetching scenes for word count (GET) for project ${projectId}:`, scenesError.message);
        // Proceed, totalWordCount will be 0
      } else if (scenes && scenes.length > 0) {
        totalWordCount = scenes.reduce((sum, scene) => sum + (scene.word_count || 0), 0);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error calculating total word count (GET) for project ${projectId}:`, error.message);
    } else {
      console.error(`An unknown error occurred while calculating total word count (GET) for project ${projectId}:`, error);
    }
    // totalWordCount remains 0
  }

  return NextResponse.json({
    ...projectData,
    wordCount: totalWordCount,
  });
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership before attempting an update
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = updateProjectSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  // The verifyProjectOwnership guard has already confirmed the project exists and belongs to the user.
  // So, we can proceed directly to the update.
  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update(validationResult.data)
    .eq('id', projectId)
    .eq('user_id', user.id) // Keep this for explicit safety on the update operation itself
    .select('id') // Only select the id to confirm the update
    .single();

  if (updateError) {
    console.error(`Error updating project ${projectId}:`, updateError);
    // The original error from Supabase might be more informative here
    return NextResponse.json({ error: `Failed to update project: ${updateError.message}`, code: updateError.code, details: updateError.details, hint: updateError.hint }, { status: 500 });
  }

  if (!updatedProject || !updatedProject.id) {
    // This case should ideally not be reached if updateError is not triggered,
    // but it's a safeguard.
    console.error(`Error updating project ${projectId}: Update succeeded but no ID was returned.`);
    return NextResponse.json({ error: 'Failed to update project: No ID returned after update.' }, { status: 500 });
  }

  // Now, fetch the full project details separately to ensure RLS for SELECT is applied correctly
  // This mimics part of the GET handler logic but is more targeted.
  const { data: projectDetails, error: fetchError } = await supabase
    .from('projects')
    .select(`
      *,
      genres (
        id,
        name,
        created_at
      )
    `)
    .eq('id', projectId)
    .eq('user_id', user.id) // Ensure we are still fetching for the correct user
    .single();

  if (fetchError) {
    console.error(`Error fetching project details after update for ${projectId}:`, fetchError);
    return NextResponse.json({ error: 'Project updated, but failed to fetch updated details.', details: fetchError.message }, { status: 500 });
  }

  // Calculate total word count for the project to include in the response by summing scene word counts
  let totalWordCount = 0;
  try {
    // Step 1: Get all chapter IDs for the project
    const { data: projectChapters, error: projectChaptersError } = await supabase
      .from('chapters')
      .select('id')
      .eq('project_id', projectId);

    if (projectChaptersError) {
      console.error(`Error fetching chapter IDs for word count (PUT) for project ${projectId}:`, projectChaptersError.message);
      // Proceed, totalWordCount will be 0
    } else if (projectChapters && projectChapters.length > 0) {
      const chapterIds = projectChapters.map(c => c.id);

      // Step 2: Get all scenes for these chapter IDs and sum their word_counts
      const { data: scenes, error: scenesError } = await supabase
        .from('scenes')
        .select('word_count') // Assuming scenes.word_count exists
        .in('chapter_id', chapterIds);

      if (scenesError) {
        console.error(`Error fetching scenes for word count (PUT) for project ${projectId}:`, scenesError.message);
        // Proceed, totalWordCount will be 0
      } else if (scenes && scenes.length > 0) {
        totalWordCount = scenes.reduce((sum, scene) => sum + (scene.word_count || 0), 0);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error calculating total word count (PUT) for project ${projectId}:`, error.message);
    } else {
      console.error(`An unknown error occurred while calculating total word count (PUT) for project ${projectId}:`, error);
    }
    // totalWordCount remains 0
  }

  return NextResponse.json({
    ...projectDetails,
    wordCount: totalWordCount,
  });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership before attempting a delete
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // The verifyProjectOwnership guard has confirmed the project exists and belongs to the user.
  // Proceed directly to delete.
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id); // Keep this for explicit safety on the delete operation itself

  if (deleteError) {
    console.error(`Error deleting project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete project', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
}
