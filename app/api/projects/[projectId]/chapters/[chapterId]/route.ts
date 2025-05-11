import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership } from '@/lib/supabase/guards'; // Import the guard
import { updateChapterSchema } from '@/lib/schemas/chapter.schema';

interface ChapterParams {
  projectId: string;
  chapterId: string;
}

// GET /api/projects/[projectId]/chapters/[chapterId]
export async function GET(request: Request, { params }: { params: ChapterParams }) {
  const { projectId, chapterId } = await params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed to fetch the specific chapter
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('project_id', projectId) // Ensure chapter belongs to the verified project
    // .eq('user_id', user.id)      // Redundant if RLS is properly set up
    .single();

  if (chapterError) {
    if (chapterError.code === 'PGRST116') {
      return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
    }
    console.error(`Error fetching chapter ${chapterId} for project ${projectId}:`, chapterError);
    return NextResponse.json({ error: 'Failed to fetch chapter', details: chapterError.message }, { status: 500 });
  }
  
  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
  }

  return NextResponse.json(chapter);
}

// PUT /api/projects/[projectId]/chapters/[chapterId]
export async function PUT(request: Request, { params }: { params: ChapterParams }) {
  const { projectId, chapterId } = await params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed with chapter update logic
  let jsonData;
  try {
    jsonData = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = updateChapterSchema.safeParse(jsonData);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.format() },
      { status: 400 }
    );
  }

  // Verify chapter exists, belongs to the project and user before updating
  const { data: existingChapter, error: fetchError } = await supabase
    .from('chapters')
    .select('id')
    .eq('id', chapterId)
    .eq('project_id', projectId) // Ensure chapter belongs to the verified project
    // .eq('user_id', user.id) // Redundant with RLS
    .single();

  if (fetchError || !existingChapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedChapter, error: updateError } = await supabase
    .from('chapters')
    .update(validationResult.data)
    .eq('id', chapterId)
    // .eq('project_id', projectId) // Already ensured by existingChapter check and RLS
    // .eq('user_id', user.id) // Redundant with RLS
    .select()
    .single();

  if (updateError) {
    console.error(`Error updating chapter ${chapterId} for project ${projectId}:`, updateError);
    return NextResponse.json({ error: 'Failed to update chapter', details: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedChapter);
}

// DELETE /api/projects/[projectId]/chapters/[chapterId]
export async function DELETE(request: Request, { params }: { params: ChapterParams }) {
  const { projectId, chapterId } = await params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership first
  const ownershipVerification = await verifyProjectOwnership(supabase, projectId, user.id);
  if (ownershipVerification.error) {
    return NextResponse.json({ error: ownershipVerification.error.message }, { status: ownershipVerification.status });
  }

  // If project ownership is verified, proceed with chapter deletion logic
  // Still need to check if the chapter itself exists within this project before deleting
  const { data: existingChapter, error: fetchError } = await supabase
    .from('chapters')
    .select('id')
    .eq('id', chapterId)
    .eq('project_id', projectId) // This check is crucial
    .single();

  if (fetchError || !existingChapter) {
    return NextResponse.json({ error: 'Chapter not found in this project or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId); // Only need to match chapterId for delete after checks

  if (deleteError) {
    console.error(`Error deleting chapter ${chapterId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete chapter', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Chapter deleted successfully' }, { status: 200 });
}
