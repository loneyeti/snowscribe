import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards';
import { updateWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { WorldBuildingNote } from '@/lib/types'; // For casting response

interface ProjectNoteParams {
  projectId: string;
  noteId: string;
}

// GET /api/projects/[projectId]/world-notes/[noteId]
export async function GET(request: Request, { params }: { params: ProjectNoteParams }) {
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

  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: note, error: noteError } = await supabase
    .from('world_building_notes')
    .select('*')
    .eq('id', noteId)
    .eq('project_id', projectId) // Ensure note belongs to the project
    .single();

  if (noteError) {
    if (noteError.code === 'PGRST116') { // PostgREST error for "No rows found"
      return NextResponse.json({ error: 'World building note not found' }, { status: 404 });
    }
    console.error(`Error fetching world building note ${noteId} for project ${projectId}:`, noteError);
    return NextResponse.json({ error: 'Failed to fetch world building note', details: noteError.message }, { status: 500 });
  }

  if (!note) {
    return NextResponse.json({ error: 'World building note not found' }, { status: 404 });
  }

  return NextResponse.json(note as WorldBuildingNote);
}

// PUT /api/projects/[projectId]/world-notes/[noteId]
export async function PUT(request: Request, { params }: { params: ProjectNoteParams }) {
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

  const validationResult = updateWorldBuildingNoteSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  // Ensure at least one field is being updated
  if (Object.keys(validationResult.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }
  
  const { title, content, category } = validationResult.data;

  const { data: updatedNote, error: updateError } = await supabase
    .from('world_building_notes')
    .update({
      title,
      content,
      category,
      updated_at: new Date().toISOString(), // Manually set updated_at
    })
    .eq('id', noteId)
    .eq('project_id', projectId) // Ensure update is on the correct project
    .select()
    .single();

  if (updateError) {
     if (updateError.code === 'PGRST116') { // No rows found for update
      return NextResponse.json({ error: 'World building note not found or you do not have permission to update it.' }, { status: 404 });
    }
    console.error(`Error updating world building note ${noteId} for project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update world building note', details: updateError.message }, { status: 500 });
  }

  if (!updatedNote) {
     return NextResponse.json({ error: 'World building note not found after update attempt.' }, { status: 404 });
  }

  return NextResponse.json(updatedNote as WorldBuildingNote);
}

// DELETE /api/projects/[projectId]/world-notes/[noteId]
export async function DELETE(request: Request, { params }: { params: ProjectNoteParams }) {
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

  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { error: deleteError, count } = await supabase
    .from('world_building_notes')
    .delete({ count: 'exact' }) // Request count of deleted rows
    .eq('id', noteId)
    .eq('project_id', projectId); // Ensure delete is on the correct project

  if (deleteError) {
    console.error(`Error deleting world building note ${noteId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete world building note', details: deleteError.message }, { status: 500 });
  }

  if (count === 0) {
    // This means the note either didn't exist or didn't belong to the project (due to RLS or the project_id check)
    return NextResponse.json({ error: 'World building note not found or you do not have permission to delete it.' }, { status: 404 });
  }

  return NextResponse.json({ message: 'World building note deleted successfully' }, { status: 200 });
}
