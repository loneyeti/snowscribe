import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCharacterSchema } from '@/lib/schemas/character.schema';
import { withProjectAuth } from '@/lib/api/utils';

interface CharacterParams {
  projectId: string;
  characterId: string;
}

export async function GET(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', p.characterId)
      .eq('project_id', p.projectId)
      .single();

    if (characterError) {
      if (characterError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 });
      }
      console.error(`Error fetching character ${p.characterId} for project ${p.projectId}:`, characterError);
      return NextResponse.json({ error: 'Failed to fetch character', details: characterError.message }, { status: 500 });
    }

    if (!character) {
      return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(character);
  });
}

export async function PUT(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = updateCharacterSchema.safeParse(jsonData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { data: existingCharacter, error: fetchError } = await supabase
      .from('characters')
      .select('id')
      .eq('id', p.characterId)
      .eq('project_id', p.projectId)
      .single();

    if (fetchError || !existingCharacter) {
      return NextResponse.json({ error: 'Character not found or access denied for update' }, { status: 404 });
    }

    const { data: updatedCharacter, error: updateError } = await supabase
      .from('characters')
      .update(validationResult.data)
      .eq('id', p.characterId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating character ${p.characterId} for project ${p.projectId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update character', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedCharacter);
  });
}

export async function DELETE(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: existingCharacter, error: fetchError } = await supabase
      .from('characters')
      .select('id')
      .eq('id', p.characterId)
      .eq('project_id', p.projectId)
      .single();

    if (fetchError || !existingCharacter) {
      return NextResponse.json({ error: 'Character not found in this project or access denied for deletion' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('id', p.characterId);

    if (deleteError) {
      console.error(`Error deleting character ${p.characterId} for project ${p.projectId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete character', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Character deleted successfully' }, { status: 200 });
  });
}
