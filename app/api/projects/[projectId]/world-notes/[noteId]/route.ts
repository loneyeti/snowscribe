import { NextResponse } from 'next/server';
import { updateWorldBuildingNoteSchema } from '@/lib/schemas/worldBuildingNote.schema';
import { withProjectAuth } from '@/lib/api/utils';
import * as worldNoteService from '@/lib/services/worldNoteService';
import { getErrorMessage } from '@/lib/utils';

interface ProjectNoteParams {
  projectId: string;
  noteId: string;
}

export async function GET(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const note = await worldNoteService.getWorldBuildingNote(p.projectId, p.noteId, authContext.user.id);
      return NextResponse.json(note);
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        return NextResponse.json({ error: 'World building note not found' }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = updateWorldBuildingNoteSchema.safeParse(jsonData);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      if (Object.keys(validationResult.data).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      const updatedNote = await worldNoteService.updateWorldBuildingNote(
        p.projectId,
        p.noteId,
        authContext.user.id,
        validationResult.data
      );
      return NextResponse.json(updatedNote);
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        return NextResponse.json({ error: 'World building note not found or you do not have permission to update it.' }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request, { params }: { params: ProjectNoteParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      await worldNoteService.deleteWorldBuildingNote(p.projectId, p.noteId, authContext.user.id);
      return NextResponse.json({ message: 'World building note deleted successfully' }, { status: 200 });
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes('not found')) {
        return NextResponse.json({ error: 'World building note not found or you do not have permission to delete it.' }, { status: 404 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
