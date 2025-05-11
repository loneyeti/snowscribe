import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema } from '@/lib/schemas/project.schema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user for GET /api/projects:', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return NextResponse.json({ error: 'Failed to fetch projects', details: projectsError.message }, { status: 500 });
  }

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user for POST /api/projects:', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch { // Error object not needed
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = createProjectSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  // Destructure genre_id and remove genre (string)
  const { title, genre_id, description, target_word_count } = validationResult.data;

  const { data: newProject, error: insertError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title,
      genre_id, // Use genre_id
      description,
      target_word_count,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating project:', insertError);
    return NextResponse.json({ error: 'Failed to create project', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newProject, { status: 201 });
}
