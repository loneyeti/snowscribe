import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards';
import { createWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { WorldBuildingNote } from '@/lib/types'; // For casting response

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/world-notes
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/world-notes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: notes, error: notesError } = await supabase
    .from('world_building_notes')
    .select('*')
    .eq('project_id', projectId)
    .order('title', { ascending: true }); // Order by title for consistency

  if (notesError) {
    console.error(`Error fetching world building notes for project ${projectId}:`, notesError);
    return NextResponse.json({ error: 'Failed to fetch world building notes', details: notesError.message }, { status: 500 });
  }

  return NextResponse.json(notes as WorldBuildingNote[]);
}

// POST /api/projects/[projectId]/world-notes
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/world-notes:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  return NextResponse.json(newNote as WorldBuildingNote, { status: 201 });
}
