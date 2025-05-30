import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
import { updateCharacterSchema } from '@/lib/schemas/character.schema';

interface CharacterParams {
  projectId: string;
  characterId: string;
}

// GET /api/projects/[projectId]/characters/[characterId]
export async function GET(request: Request, { params }: { params: CharacterParams }) {
  const { projectId, characterId } = await params;
  if (!projectId || !characterId) {
    return NextResponse.json({ error: 'Project ID and Character ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/characters/${characterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed to fetch the specific character
  const { data: character, error: characterError } = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .eq('project_id', projectId)
    // .eq('user_id', user.id) // RLS handles user ownership via project
    .single();

  if (characterError) {
    if (characterError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 });
    }
    console.error(`Error fetching character ${characterId} for project ${projectId}:`, characterError);
    return NextResponse.json({ error: 'Failed to fetch character', details: characterError.message }, { status: 500 });
  }

  if (!character) {
     return NextResponse.json({ error: 'Character not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(character);
}

// PUT /api/projects/[projectId]/characters/[characterId]
export async function PUT(request: Request, { params }: { params: CharacterParams }) {
  const { projectId, characterId } = await params;
  if (!projectId || !characterId) {
    return NextResponse.json({ error: 'Project ID and Character ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}/characters/${characterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed with character update logic
  let jsonData;
  try {
    jsonData = await request.json();
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

  // Verify character exists, belongs to project and user before updating
  const { data: existingCharacter, error: fetchError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('project_id', projectId)
    // .eq('user_id', user.id) // RLS handles user ownership via project
    .single();

  if (fetchError || !existingCharacter) {
    return NextResponse.json({ error: 'Character not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedCharacter, error: updateError } = await supabase
    .from('characters')
    .update(validationResult.data)
    .eq('id', characterId)
    // .eq('project_id', projectId) // Redundant
    // .eq('user_id', user.id) // Redundant
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating character ${characterId} for project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update character', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedCharacter);
}

// DELETE /api/projects/[projectId]/characters/[characterId]
export async function DELETE(request: Request, { params }: { params: CharacterParams }) {
  const { projectId, characterId } = await params;
  if (!projectId || !characterId) {
    return NextResponse.json({ error: 'Project ID and Character ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}/characters/${characterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed with character deletion logic
  // Still need to check if the character itself exists within this project before deleting
  const { data: existingCharacter, error: fetchError } = await supabase
    .from('characters')
    .select('id')
    .eq('id', characterId)
    .eq('project_id', projectId) // This check is crucial
    .single();

  if (fetchError || !existingCharacter) {
    // Use 404 if character not found in this project, or if fetchError (e.g. RLS denies if project_id was spoofed)
    return NextResponse.json({ error: 'Character not found in this project or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId); // Only need to match characterId for delete after checks

  if (deleteError) {
    console.error(`Error deleting character ${characterId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete character', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Character deleted successfully' }, { status: 200 });
}
