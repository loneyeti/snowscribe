import { createClient } from '@/lib/supabase/server';
import { verifyProjectOwnership, isSiteAdmin } from '@/lib/supabase/guards';
import { type User } from '@supabase/supabase-js';
import { type Project } from '@/lib/types';
import { NextResponse } from 'next/server';

// Context for routes that only need authentication
interface SimpleAuthContext {
  user: User;
}

// Context for routes that need both authentication and project ownership verification
interface ProjectAuthContext {
  user: User;
  project: Project;
}

// Context for scene routes that need additional verification
interface SceneAuthContext extends ProjectAuthContext {
  chapterId: string;
  sceneId: string;
}

// Handler type for simple authenticated routes
type SimpleAuthenticatedHandler = (
  request: Request,
  authContext: SimpleAuthContext
) => Promise<NextResponse>;

// Handler type for project-authenticated routes
type ProjectAuthenticatedHandler<T> = (
  request: Request,
  params: T,
  authContext: ProjectAuthContext
) => Promise<NextResponse>;

// Handler type for scene-authenticated routes
type SceneAuthenticatedHandler<T> = (
  request: Request,
  params: T,
  authContext: SceneAuthContext
) => Promise<NextResponse>;

/**
 * A higher-order function to wrap API route handlers with basic user authentication.
 * @param request - The incoming Request object
 * @param handler - The route-specific logic to execute after successful authentication
 * @returns A NextResponse object
 */
export async function withAuth(
  request: Request,
  handler: SimpleAuthenticatedHandler
): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handler(request, { user });
}

/**
 * A higher-order function to wrap API route handlers with user authentication
 * and project ownership verification.
 */
export async function withProjectAuth<T extends { projectId: string }>(
  request: Request,
  paramsResolver: () => Promise<T>,
  handler: ProjectAuthenticatedHandler<T>
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params resolution
    const params = await paramsResolver();

    const ownership = await verifyProjectOwnership(
      supabase,
      params.projectId,
      user.id
    );

    if (ownership.error) {
      return NextResponse.json(
        { error: ownership.error.message },
        { status: ownership.status }
      );
    }

    return handler(request, params, { user, project: ownership.project as Project });
  } catch (error) {
    console.error("Error in withProjectAuth:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * A higher-order function to wrap scene API route handlers with:
 * - User authentication
 * - Project ownership verification
 * - Scene/chapter relationship verification
 */
export async function withSceneAuth<T extends { projectId: string; chapterId: string; sceneId: string }>(
  request: Request,
  params: T,
  handler: SceneAuthenticatedHandler<T>
): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Verify project ownership
  const ownership = await verifyProjectOwnership(
    supabase,
    params.projectId,
    user.id
  );

  if (ownership.error) {
    return NextResponse.json(
      { error: ownership.error.message },
      { status: ownership.status }
    );
  }

  // 2. Verify scene belongs to chapter and project
  const { data: scene, error: sceneError } = await supabase
    .from('scenes')
    .select('id, chapters!inner(project_id)')
    .eq('id', params.sceneId)
    .eq('chapter_id', params.chapterId)
    .eq('chapters.project_id', params.projectId)
    .single();

  if (sceneError || !scene) {
    return NextResponse.json(
      { error: 'Scene not found or access denied' },
      { status: 404 }
    );
  }

  return handler(request, params, { 
    user, 
    project: ownership.project as Project,
    chapterId: params.chapterId,
    sceneId: params.sceneId
  });
}

/**
 * A higher-order function to wrap API route handlers with admin authentication.
 * Verifies the user is both authenticated and has admin privileges.
 */
export async function withAdminAuth(
  request: Request,
  handler: SimpleAuthenticatedHandler
): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminCheck = await isSiteAdmin(supabase);
  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return handler(request, { user });
}
