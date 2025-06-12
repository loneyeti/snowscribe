import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as characterService from '@/lib/services/characterService';
import { getErrorMessage } from '@/lib/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const characters = await characterService.getCharacters(p.projectId, authContext.user.id);
      return NextResponse.json(characters);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function POST(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const newCharacter = await characterService.createCharacter(
        p.projectId, 
        authContext.user.id, 
        jsonData
      );
      return NextResponse.json(newCharacter, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
