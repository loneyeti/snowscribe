import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SceneTag } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const supabase = await createClient();
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch tags specific to the project OR global tags (where project_id is null)
    // It might be better to also consider user_id for global tags if they are user-specific global tags.
    // For now, assuming project_id IS NULL means it's a system/default global tag.
    const { data: sceneTags, error } = await supabase
      .from('scene_tags')
      .select('*')
      .or(`project_id.eq.${projectId},project_id.is.null`) // Fetches project-specific and global tags
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching scene tags:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sceneTags as SceneTag[]);
  } catch (err) {
    console.error('Unexpected error fetching scene tags:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
