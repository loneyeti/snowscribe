import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateChapterSchema } from '@/lib/schemas/chapter.schema';
import { withProjectAuth } from '@/lib/api/utils';

interface ChapterParams {
  projectId: string;
  chapterId: string;
}

export async function GET(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', p.chapterId)
      .eq('project_id', p.projectId)
      .single();

    if (chapterError) {
      if (chapterError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
      }
      console.error(`Error fetching chapter ${p.chapterId} for project ${p.projectId}:`, chapterError);
      return NextResponse.json({ error: 'Failed to fetch chapter', details: chapterError.message }, { status: 500 });
    }
    
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(chapter);
  });
}

export async function PUT(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    let jsonData;
    try {
      jsonData = await req.json();
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

    const { data: existingChapter, error: fetchError } = await supabase
      .from('chapters')
      .select('id')
      .eq('id', p.chapterId)
      .eq('project_id', p.projectId)
      .single();

    if (fetchError || !existingChapter) {
      return NextResponse.json({ error: 'Chapter not found or access denied for update' }, { status: 404 });
    }

    const { data: updatedChapter, error: updateError } = await supabase
      .from('chapters')
      .update(validationResult.data)
      .eq('id', p.chapterId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating chapter ${p.chapterId} for project ${p.projectId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update chapter', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedChapter);
  });
}

export async function DELETE(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: existingChapter, error: fetchError } = await supabase
      .from('chapters')
      .select('id')
      .eq('id', p.chapterId)
      .eq('project_id', p.projectId)
      .single();

    if (fetchError || !existingChapter) {
      return NextResponse.json({ error: 'Chapter not found in this project or access denied for deletion' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', p.chapterId);

    if (deleteError) {
      console.error(`Error deleting chapter ${p.chapterId} for project ${p.projectId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete chapter', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Chapter deleted successfully' }, { status: 200 });
  });
}
