import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as sceneService from '@/lib/services/sceneService';
import { getErrorMessage } from '@/lib/utils';

interface ChapterSceneParams {
  projectId: string;
  chapterId: string;
}

export async function GET(request: Request, { params }: { params: ChapterSceneParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const scenes = await sceneService.getScenesByChapterId(p.projectId, p.chapterId, authContext.user.id);
      return NextResponse.json(scenes);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function POST(request: Request, { params }: { params: ChapterSceneParams }) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const newScene = await sceneService.createScene(p.projectId, p.chapterId, authContext.user.id, jsonData);
      return NextResponse.json(newScene, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
