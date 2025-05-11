import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createChapterSchema } from '@/lib/schemas/chapter.schema';

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/chapters
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/chapters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // First, verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('*, scenes(id, content)') // Fetch scenes (id and content) along with chapters
    .eq('project_id', projectId)
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (chaptersError) {
    console.error(`Error fetching chapters for project ${projectId}:`, chaptersError);
    return NextResponse.json({ error: 'Failed to fetch chapters', details: chaptersError.message }, { status: 500 });
  }

  return NextResponse.json(chapters);
}

// POST /api/projects/[projectId]/chapters
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params; // Await params
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/chapters:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the project exists and belongs to the user
  const { data: project, error: projectFetchError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectFetchError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied for creating chapter' }, { status: 404 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Add projectId to the data to be validated, as schema expects it but it's not in request body
  const dataToValidate = { ...jsonData, project_id: projectId };
  const validationResult = createChapterSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { title, description } = validationResult.data;
  let order = validationResult.data.order; // order can be reassigned

  if (order === undefined) {
    // If order is not provided, calculate the next order value
    const { data: maxOrderChapter, error: orderError } = await supabase
      .from('chapters')
      .select('order')
      .eq('project_id', projectId)
      .order('order', { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle to handle no chapters existing

    if (orderError) {
      console.error(`Error fetching max order for project ${projectId}:`, orderError);
      // Fallback or error handling strategy. For now, default to 0 if error.
      // Consider returning 500 if this query fails in a production scenario.
      order = 0;
    } else if (maxOrderChapter) {
      order = maxOrderChapter.order + 1;
    } else {
      order = 0; // This is the first chapter for the project
    }
  }

  const { data: newChapter, error: insertError } = await supabase
    .from('chapters')
    .insert({
      project_id: projectId, // Ensure chapter is linked to the correct project
      title,
      description,
      order, // Use the determined order
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating chapter for project ${projectId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create chapter', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newChapter, { status: 201 });
}
