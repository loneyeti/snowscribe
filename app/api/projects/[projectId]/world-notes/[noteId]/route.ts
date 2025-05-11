import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';

interface WorldNoteParams {
  projectId: string;
  noteId: string;
}

// GET /api/projects/[projectId]/world-notes/[noteId]
export async function GET(request: Request, { params }: { params: WorldNoteParams }) {
  const { projectId, noteId } = await params;
  if (!projectId || !noteId) {
    return NextResponse.json({ error: 'Project ID and Note ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/world-notes/${noteId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: note, error: noteError } = await supabase
    .from('world_building_notes')
    .select('*')
    .eq('id', noteId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (noteError) {
    if (noteError.code === 'PGRST116') {
      return NextResponse.json({ error: 'World building note not found or access denied' }, { status: 404 });
    }
    console.error(`Error fetching world building note ${noteId} for project ${projectId}:`, noteError);
    return NextResponse.json({ error: 'Failed to fetch world building note', details: noteError.message }, { status: 500 });
  }
  
  if (!note) {
    return NextResponse.json({ error: 'World building note not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(note);
}

// PUT /api/projects/[projectId]/world-notes/[noteId]
export async function PUT(request: Request, { params }: { params: WorldNoteParams }) {
  const { projectId, noteId } = await params;
  if (!projectId || !noteId) {
    return NextResponse.json({ error: 'Project ID and Note ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}/world-notes/${noteId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = updateWorldBuildingNoteSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  // Verify note exists, belongs to project and user before updating
  const { data: existingNote, error: fetchError } = await supabase
    .from('world_building_notes')
    .select('id')
    .eq('id', noteId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingNote) {
    return NextResponse.json({ error: 'World building note not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedNote, error: updateError } = await supabase
    .from('world_building_notes')
    .update(validationResult.data)
    .eq('id', noteId)
    // .eq('project_id', projectId) // Redundant
    // .eq('user_id', user.id) // Redundant
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating world building note ${noteId} for project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update world building note', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedNote);
}

// DELETE /api/projects/[projectId]/world-notes/[noteId]
export async function DELETE(request: Request, { params }: { params: WorldNoteParams }) {
  const { projectId, noteId } = await params;
  if (!projectId || !noteId) {
    return NextResponse.json({ error: 'Project ID and Note ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}/world-notes/${noteId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify note exists, belongs to project and user before deleting
  const { data: existingNote, error: fetchError } = await supabase
    .from('world_building_notes')
    .select('id')
    .eq('id', noteId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingNote) {
    return NextResponse.json({ error: 'World building note not found or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('world_building_notes')
    .delete()
    .eq('id', noteId);
    // .eq('project_id', projectId) // Redundant
    // .eq('user_id', user.id); // Redundant

  if (deleteError) {
    console.error(`Error deleting world building note ${noteId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete world building note', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'World building note deleted successfully' }, { status: 200 });
}
