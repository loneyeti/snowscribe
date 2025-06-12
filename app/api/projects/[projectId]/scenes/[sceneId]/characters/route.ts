import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as sceneService from '@/lib/services/sceneService';
import { getErrorMessage } from '@/lib/utils';
import { z } from 'zod';

interface SceneCharacterParams {
  projectId: string;
  sceneId: string;
}

const updateSceneCharactersSchema = z.object({
  characterIds: z.array(z.string().uuid()),
});

export async function PUT(request: Request, { params }: { params: SceneCharacterParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = updateSceneCharactersSchema.safeParse(jsonData);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      await sceneService.updateSceneCharacters(
        p.projectId,
        p.sceneId,
        authContext.user.id,
        validationResult.data.characterIds
      );

      return NextResponse.json(
        { message: 'Scene characters updated successfully', sceneId: p.sceneId, characterIds: validationResult.data.characterIds },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
