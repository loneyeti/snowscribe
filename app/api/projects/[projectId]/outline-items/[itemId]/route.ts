import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateOutlineItemSchema } from '@/lib/schemas/outlineItem.schema';

interface OutlineItemParams {
  projectId: string;
  itemId: string;
}

// GET /api/projects/[projectId]/outline-items/[itemId]
export async function GET(request: Request, { params }: { params: OutlineItemParams }) {
  const { projectId, itemId } = await params;
  if (!projectId || !itemId) {
    return NextResponse.json({ error: 'Project ID and Item ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/outline-items/${itemId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: item, error: itemError } = await supabase
    .from('outline_items')
    .select('*')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (itemError) {
    if (itemError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Outline item not found or access denied' }, { status: 404 });
    }
    console.error(`Error fetching outline item ${itemId} for project ${projectId}:`, itemError);
    return NextResponse.json({ error: 'Failed to fetch outline item', details: itemError.message }, { status: 500 });
  }
  
  if (!item) {
    return NextResponse.json({ error: 'Outline item not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PUT /api/projects/[projectId]/outline-items/[itemId]
export async function PUT(request: Request, { params }: { params: OutlineItemParams }) {
  const { projectId, itemId } = await params;
  if (!projectId || !itemId) {
    return NextResponse.json({ error: 'Project ID and Item ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}/outline-items/${itemId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = updateOutlineItemSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }
  
  const { parent_id } = validationResult.data;

  // If parent_id is provided, verify it belongs to the same project and user, and is not the item itself
  if (parent_id) {
    if (parent_id === itemId) {
      return NextResponse.json({ error: 'Item cannot be its own parent.' }, { status: 400 });
    }
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


  // Verify item exists, belongs to project and user before updating
  const { data: existingItem, error: fetchError } = await supabase
    .from('outline_items')
    .select('id')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingItem) {
    return NextResponse.json({ error: 'Outline item not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedItem, error: updateError } = await supabase
    .from('outline_items')
    .update(validationResult.data)
    .eq('id', itemId)
    // .eq('project_id', projectId) // Redundant
    // .eq('user_id', user.id) // Redundant
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating outline item ${itemId} for project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update outline item', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedItem);
}

// DELETE /api/projects/[projectId]/outline-items/[itemId]
export async function DELETE(request: Request, { params }: { params: OutlineItemParams }) {
  const { projectId, itemId } = await params;
  if (!projectId || !itemId) {
    return NextResponse.json({ error: 'Project ID and Item ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}/outline-items/${itemId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify item exists, belongs to project and user before deleting
  const { data: existingItem, error: fetchError } = await supabase
    .from('outline_items')
    .select('id')
    .eq('id', itemId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingItem) {
    return NextResponse.json({ error: 'Outline item not found or access denied for deletion' }, { status: 404 });
  }
  
  // Note: Cascading delete for children of this outline_item is handled by `onDelete: Cascade` in the migration.
  const { error: deleteError } = await supabase
    .from('outline_items')
    .delete()
    .eq('id', itemId);
    // .eq('project_id', projectId) // Redundant
    // .eq('user_id', user.id); // Redundant

  if (deleteError) {
    console.error(`Error deleting outline item ${itemId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete outline item', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Outline item deleted successfully' }, { status: 200 });
}
