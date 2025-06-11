import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as sceneService from '@/lib/services/sceneService';
import { getErrorMessage } from '@/lib/utils';
import { updateSceneSchema } from '@/lib/schemas/scene.schema';

interface SceneParams {
  projectId: string;
  chapterId: string;
  sceneId: string;
}

export async function GET(request: Request, { params }: { params: SceneParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const scene = await sceneService.getSceneById(p.projectId, p.chapterId, p.sceneId, authContext.user.id);
      if (!scene) {
        return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
      }
      return NextResponse.json(scene);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: SceneParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const validationResult = updateSceneSchema.safeParse(jsonData);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const updatedScene = await sceneService.updateScene(
        p.projectId,
        p.chapterId,
        p.sceneId,
        authContext.user.id,
        validationResult.data
      );
      return NextResponse.json(updatedScene);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request, { params }: { params: SceneParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      await sceneService.deleteScene(p.projectId, p.chapterId, p.sceneId, authContext.user.id);
      return NextResponse.json({ message: 'Scene deleted successfully' }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
