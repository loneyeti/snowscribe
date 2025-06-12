import { NextResponse } from 'next/server';
import { createWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { withProjectAuth } from '@/lib/api/utils';
import * as worldNoteService from '@/lib/services/worldNoteService';
import { getErrorMessage } from '@/lib/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const notes = await worldNoteService.getWorldBuildingNotes(p.projectId, authContext.user.id);
      return NextResponse.json(notes);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function POST(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = createWorldBuildingNoteSchema.omit({ project_id: true }).safeParse(jsonData);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      const newNote = await worldNoteService.createWorldBuildingNote(
        p.projectId,
        authContext.user.id,
        validationResult.data
      );
      return NextResponse.json(newNote, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
