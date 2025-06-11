import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as characterService from '@/lib/services/characterService';
import { getErrorMessage } from '@/lib/utils';

interface CharacterParams {
  projectId: string;
  characterId: string;
}

export async function GET(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const character = await characterService.getCharacter(
        p.projectId, 
        p.characterId, 
        authContext.user.id
      );
      if (!character) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      return NextResponse.json(character);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const updatedCharacter = await characterService.updateCharacter(
        p.projectId,
        p.characterId,
        authContext.user.id,
        jsonData
      );
      return NextResponse.json(updatedCharacter);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request, { params }: { params: CharacterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      await characterService.deleteCharacter(
        p.projectId,
        p.characterId,
        authContext.user.id
      );
      return NextResponse.json(
        { message: 'Character deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
