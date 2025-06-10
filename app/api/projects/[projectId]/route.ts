import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateProjectSchema } from '@/lib/schemas/project.schema';

interface Params {
  projectId: string;
}

import { withProjectAuth } from '@/lib/api/utils';

export async function GET(request: Request, { params }: { params: Params }) {
  return withProjectAuth(request, params, async (req, p) => {
    const supabase = await createClient();

    const { data: projectData, error: projectFetchError } = await supabase
      .from('projects')
      .select(`
        *,
        genres (
          id,
          name,
          created_at
        )
      `)
      .eq('id', p.projectId)
      .single();

    if (projectFetchError || !projectData) {
      console.error(`Error fetching full project details for ${p.projectId} after ownership verification:`, projectFetchError?.message);
      return NextResponse.json({ error: 'Failed to fetch full project details after verification', details: projectFetchError?.message }, { status: 500 });
    }

    let totalWordCount = 0;
    try {
      const { data: projectChapters, error: projectChaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('project_id', p.projectId);
      if (projectChaptersError) {
        console.error(`Error fetching chapter IDs for word count (GET) for project ${p.projectId}:`, projectChaptersError.message);
      } else if (projectChapters && projectChapters.length > 0) {
        const chapterIds = projectChapters.map(c => c.id);
        const { data: scenes, error: scenesError } = await supabase
          .from('scenes')
          .select('word_count')
          .in('chapter_id', chapterIds);
        if (scenesError) {
          console.error(`Error fetching scenes for word count (GET) for project ${p.projectId}:`, scenesError.message);
        } else if (scenes && scenes.length > 0) {
          totalWordCount = scenes.reduce((sum, scene) => sum + (scene.word_count || 0), 0);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error calculating total word count (GET) for project ${p.projectId}:`, error.message);
      } else {
        console.error(`An unknown error occurred while calculating total word count (GET) for project ${p.projectId}:`, error);
      }
    }

    return NextResponse.json({
      ...projectData,
      wordCount: totalWordCount,
    });
  });
}

export async function PUT(request: Request, { params }: { params: Params }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = updateProjectSchema.safeParse(jsonData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update(validationResult.data)
      .eq('id', p.projectId)
      .eq('user_id', authContext.user.id);

    if (updateError) {
      console.error(`Error updating project ${p.projectId}:`, updateError);
      return NextResponse.json({ error: `Failed to update project: ${updateError.message}`, code: updateError.code, details: updateError.details, hint: updateError.hint }, { status: 500 });
    }

    const { data: projectDetails, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        genres (
          id,
          name,
          created_at
        )
      `)
      .eq('id', p.projectId)
      .eq('user_id', authContext.user.id)
      .single();

    if (fetchError) {
      console.error(`Error fetching project details after update for ${p.projectId}:`, fetchError);
      return NextResponse.json({ error: 'Project updated, but failed to fetch updated details.', details: fetchError.message }, { status: 500 });
    }

    let totalWordCount = 0;
    try {
      const { data: projectChapters, error: projectChaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('project_id', p.projectId);
      if (projectChaptersError) {
        console.error(`Error fetching chapter IDs for word count (PUT) for project ${p.projectId}:`, projectChaptersError.message);
      } else if (projectChapters && projectChapters.length > 0) {
        const chapterIds = projectChapters.map(c => c.id);
        const { data: scenes, error: scenesError } = await supabase
          .from('scenes')
          .select('word_count')
          .in('chapter_id', chapterIds);
        if (scenesError) {
          console.error(`Error fetching scenes for word count (PUT) for project ${p.projectId}:`, scenesError.message);
        } else if (scenes && scenes.length > 0) {
          totalWordCount = scenes.reduce((sum, scene) => sum + (scene.word_count || 0), 0);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error calculating total word count (PUT) for project ${p.projectId}:`, error.message);
      } else {
        console.error(`An unknown error occurred while calculating total word count (PUT) for project ${p.projectId}:`, error);
      }
    }
    
    return NextResponse.json({
      ...projectDetails,
      wordCount: totalWordCount,
    });
  });
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    const supabase = await createClient();
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', p.projectId)
      .eq('user_id', authContext.user.id);

    if (deleteError) {
      console.error(`Error deleting project ${p.projectId}:`, deleteError);
      return NextResponse.json({ error: 'Failed to delete project', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' }, { status: 200 });
  });
}
