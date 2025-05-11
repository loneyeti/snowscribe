import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
import { createCharacterSchema } from '@/lib/schemas/character.schema';

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/characters
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/characters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  const { data: characters, error: charactersError } = await supabase
    .from('characters')
    .select('*')
    .eq('project_id', projectId)
    // .eq('user_id', user.id) // Redundant if project check is solid
    .order('created_at', { ascending: true });

  if (charactersError) {
    console.error(`Error fetching characters for project ${projectId}:`, charactersError);
    return NextResponse.json({ error: 'Failed to fetch characters', details: charactersError.message }, { status: 500 });
  }

  return NextResponse.json(characters);
}

// POST /api/projects/[projectId]/characters
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/characters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership
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
      project_id: projectId,
      name,
      description,
      notes,
      image_url,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating character for project ${projectId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create character', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newCharacter, { status: 201 });
}
