import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateChapterSchema } from '@/lib/schemas/chapter.schema';

interface ChapterParams {
  projectId: string;
  chapterId: string;
}

// GET /api/projects/[projectId]/chapters/[chapterId]
export async function GET(request: Request, { params }: { params: ChapterParams }) {
  const { projectId, chapterId } = params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for GET /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('project_id', projectId) // Ensure chapter belongs to the project
    .eq('user_id', user.id)      // Ensure chapter belongs to the user
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
  const { projectId, chapterId } = params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for PUT /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingChapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied for update' }, { status: 404 });
  }

  const { data: updatedChapter, error: updateError } = await supabase
    .from('chapters')
    .update(validationResult.data)
    .eq('id', chapterId)
    .eq('project_id', projectId) // Redundant but safe
    .eq('user_id', user.id)
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
  const { projectId, chapterId } = params;
  if (!projectId || !chapterId) {
    return NextResponse.json({ error: 'Project ID and Chapter ID are required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(`Error fetching user for DELETE /api/projects/${projectId}/chapters/${chapterId}:`, userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify chapter exists, belongs to the project and user before deleting
  const { data: existingChapter, error: fetchError } = await supabase
    .from('chapters')
    .select('id')
    .eq('id', chapterId)
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingChapter) {
    return NextResponse.json({ error: 'Chapter not found or access denied for deletion' }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('project_id', projectId) // Redundant but safe
    .eq('user_id', user.id);

  if (deleteError) {
    console.error(`Error deleting chapter ${chapterId} for project ${projectId}:`, deleteError);
    return NextResponse.json({ error: 'Failed to delete chapter', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Chapter deleted successfully' }, { status: 200 });
}
