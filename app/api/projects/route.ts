import { NextResponse } from 'next/server';
import { createProjectSchema } from '@/lib/schemas/project.schema';
import { withAuth } from '@/lib/api/utils';
import { createProject, getProjectsForUser } from '@/lib/services/projectService';

export async function GET(request: Request) {
  return withAuth(request, async (req, authContext) => {
    try {
      const projects = await getProjectsForUser(authContext.user.id);
      return NextResponse.json(projects);
    } catch (error) {
      console.error('[API] Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (req, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = createProjectSchema.safeParse(jsonData);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const newProject = await createProject(authContext.user.id, validationResult.data);
      return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid JSON body') {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
      console.error('[API] Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }
  });
}
