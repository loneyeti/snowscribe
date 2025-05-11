import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOutlineItemSchema } from '@/lib/schemas/outlineItem.schema';

interface ProjectParams {
  projectId: string;
}

// GET /api/projects/[projectId]/outline-items
export async function GET(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/outline-items:`, userError);
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
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
  }

  const { data: items, error: itemsError } = await supabase
    .from('outline_items')
    .select('*')
    .eq('project_id', projectId)
    // .eq('user_id', user.id) // Redundant
    .order('parent_id', { ascending: true, nullsFirst: true }) // Group by parent
    .order('order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (itemsError) {
    console.error(`Error fetching outline items for project ${projectId}:`, itemsError);
    return NextResponse.json({ error: 'Failed to fetch outline items', details: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(items);
}

// POST /api/projects/[projectId]/outline-items
export async function POST(request: Request, { params }: { params: ProjectParams }) {
  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for POST /api/projects/${projectId}/outline-items:`, userError);
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
    return NextResponse.json({ error: 'Project not found or access denied for creating outline item' }, { status: 404 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const dataToValidate = { ...jsonData, project_id: projectId };
  const validationResult = createOutlineItemSchema.safeParse(dataToValidate);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  const { title, content, order, parent_id } = validationResult.data;

  // If parent_id is provided, verify it belongs to the same project and user
  if (parent_id) {
    const { data: parentItem, error: parentFetchError } = await supabase
      .from('outline_items')
      .select('id')
      .eq('id', parent_id)
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();
    if (parentFetchError || !parentItem) {
      return NextResponse.json({ error: 'Invalid parent_id: not found or access denied.' }, { status: 400 });
    }
  }

  const { data: newItem, error: insertError } = await supabase
    .from('outline_items')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title,
      content,
      order,
      parent_id,
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Error creating outline item for project ${projectId}:`, insertError);
    return NextResponse.json({ error: 'Failed to create outline item', details: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newItem, { status: 201 });
}
