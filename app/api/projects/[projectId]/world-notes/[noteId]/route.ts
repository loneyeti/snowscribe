import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { withProjectAuth } from '@/lib/api/utils';
import { WorldBuildingNote } from '@/lib/types';

interface ProjectNoteParams {
  projectId: string;
  noteId: string;
}

export async function GET(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: note, error: noteError } = await supabase
      .from('world_building_notes')
      .select('*')
      .eq('id', p.noteId)
      .eq('project_id', p.projectId)
      .single();

    if (noteError) {
      if (noteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'World building note not found' }, { status: 404 });
      }
      console.error(`Error fetching world building note ${p.noteId} for project ${p.projectId}:`, noteError);
      return NextResponse.json({ error: 'Failed to fetch world building note', details: noteError.message }, { status: 500 });
    }

    if (!note) {
      return NextResponse.json({ error: 'World building note not found' }, { status: 404 });
    }

    return NextResponse.json(note as WorldBuildingNote);
  });
}

export async function PUT(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    let jsonData;
    try {
      jsonData = await req.json();
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.noteId)
      .eq('project_id', p.projectId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'World building note not found or you do not have permission to update it.' }, { status: 404 });
      }
      console.error(`Error updating world building note ${p.noteId} for project ${p.projectId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update world building note', details: updateError.message }, { status: 500 });
    }

    if (!updatedNote) {
      return NextResponse.json({ error: 'World building note not found after update attempt.' }, { status: 404 });
    }

    return NextResponse.json(updatedNote as WorldBuildingNote);
  });
}

export async function DELETE(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { error: deleteError, count } = await supabase
      .from('world_building_notes')
      .delete({ count: 'exact' })
      .eq('id', p.noteId)
      .eq('project_id', p.projectId);

    if (deleteError) {
      console.error(`Error deleting world building note ${p.noteId} for project ${p.projectId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete world building note', details: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'World building note not found or you do not have permission to delete it.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'World building note deleted successfully' }, { status: 200 });
  });
}
