import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCharacterSchema } from '@/lib/schemas/character.schema';
import { withProjectAuth } from '@/lib/api/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();
    const { data: characters, error: charactersError } = await supabase
      .from('characters')
      .select('*')
      .eq('project_id', p.projectId)
      .order('created_at', { ascending: true });

    if (charactersError) {
      console.error(`Error fetching characters for project ${p.projectId}:`, charactersError);
      return NextResponse.json({ error: 'Failed to fetch characters', details: charactersError.message }, { status: 500 });
    }
    return NextResponse.json(characters);
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
    const validationResult = createCharacterSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, notes, image_url } = validationResult.data;
    const { data: newCharacter, error: insertError } = await supabase
      .from('characters')
      .insert({
        project_id: p.projectId,
        name,
        description,
        notes,
        image_url,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating character for project ${p.projectId}:`, insertError);
      return NextResponse.json({ error: 'Failed to create character', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newCharacter, { status: 201 });
  });
}
