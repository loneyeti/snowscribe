import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProjectSchema } from '@/lib/schemas/project.schema';
import { type User } from '@supabase/supabase-js';
import { withAuth } from '@/lib/api/utils';

interface AuthContext {
  user: User;
}

export async function GET(request: Request) {
  return withAuth(request, async (req, authContext) => {
    const supabase = await createClient();
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', authContext.user.id)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: projectsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(projects);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (req, authContext) => {
    const supabase = await createClient();
    let jsonData;
    try {
      jsonData = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationResult = createProjectSchema.safeParse(jsonData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { title, genre_id, log_line, target_word_count } = validationResult.data;

    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: authContext.user.id,
        title,
        genre_id,
        log_line,
        target_word_count,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating project:', insertError);
      return NextResponse.json(
        { error: 'Failed to create project', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newProject, { status: 201 });
  });
}
