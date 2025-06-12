import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as sceneService from '@/lib/services/sceneService';
import { getErrorMessage } from '@/lib/utils';
import { z } from 'zod';

interface SceneTagParams {
  projectId: string;
  sceneId: string;
}

const updateSceneTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

export async function PUT(request: Request, { params }: { params: SceneTagParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = updateSceneTagsSchema.safeParse(jsonData);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      await sceneService.updateSceneTags(
        p.projectId,
        p.sceneId,
        authContext.user.id,
        validationResult.data.tagIds
      );

      return NextResponse.json(
        { message: 'Scene tags updated successfully', sceneId: p.sceneId, tagIds: validationResult.data.tagIds },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
