import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { type WorldBuildingNote } from '@/lib/types';
import { withProjectAuth } from '@/lib/api/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    const { data: notes, error: notesError } = await supabase
      .from('world_building_notes')
      .select('*')
      .eq('project_id', p.projectId)
      .order('title', { ascending: true });

    if (notesError) {
      console.error(`Error fetching world building notes for project ${p.projectId}:`, notesError);
      return NextResponse.json({ error: 'Failed to fetch world building notes', details: notesError.message }, { status: 500 });
    }

    return NextResponse.json(notes as WorldBuildingNote[]);
  });
}

export async function POST(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const dataToValidate = { ...jsonData, project_id: p.projectId };
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
        project_id: p.projectId,
        title,
        content,
        category,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating world building note for project ${p.projectId}:`, insertError);
      return NextResponse.json({ error: 'Failed to create world building note', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newNote as WorldBuildingNote, { status: 201 });
  });
}
