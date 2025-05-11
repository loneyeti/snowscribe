import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

  const { data: projectData, error: projectError } = await supabase
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
    .eq('user_id', user.id)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') { // PostgREST error for "No rows found"
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
    console.error(`Error fetching project ${projectId}:`, projectError);
    return NextResponse.json({ error: 'Failed to fetch project', details: projectError.message }, { status: 500 });
  }

  if (!projectData) {
     return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  // Calculate total word count for the project
  let totalWordCount = 0;
  try {
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('word_count')
      .eq('project_id', projectId)
      .eq('user_id', user.id); // Ensure chapters also belong to the user for safety

    if (chaptersError) {
      console.error(`Error fetching chapters for word count for project ${projectId}:`, chaptersError.message);
      // Proceed without word count if chapters can't be fetched
    } else if (chapters && chapters.length > 0) {
      totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error calculating total word count for project ${projectId}:`, error.message);
    } else {
      console.error(`An unknown error occurred while calculating total word count for project ${projectId}:`, error);
    }
    // Proceed with project data but word count will be 0
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

  // First, verify the project exists and belongs to the user
  const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingProject) {
    return NextResponse.json({ error: 'Project not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update(validationResult.data)
    .eq('id', projectId)
    .eq('user_id', user.id) // Ensure user can only update their own projects
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update project', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedProject);
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

  // First, verify the project exists and belongs to the user
   const { data: existingProject, error: fetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingProject) {
    return NextResponse.json({ error: 'Project not found or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id); // Ensure user can only delete their own projects

  if (deleteError) {
    console.error(`Error deleting project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete project', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
}
