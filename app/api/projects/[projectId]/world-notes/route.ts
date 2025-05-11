import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/world-notes
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/world-notes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const { data: notes, error: notesError } = await supabase
    .from('world_building_notes')
    .select('*')
    .eq('project_id', projectId)
    // .eq('user_id', user.id) // Redundant
    .order('created_at', { ascending: true });

  if (notesError) {
    console.error(`Error fetching world building notes for project ${projectId}:`, notesError);
    return NextResponse.json({ error: 'Failed to fetch world building notes', details: notesError.message }, { status: 500 });
  }

  return NextResponse.json(notes);
}

// POST /api/projects/[projectId]/world-notes
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/world-notes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied for creating world note' }, { status: 404 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const dataToValidate = { ...jsonData, project_id: projectId };
  const validationResult = createWorldBuildingNoteSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { title, content, category } = validationResult.data;

  const { data: newNote, error: insertError } = await supabase
    .from('world_building_notes')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title,
      content,
      category,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating world building note for project ${projectId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create world building note', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newNote, { status: 201 });
}
