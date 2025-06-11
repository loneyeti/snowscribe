import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as chapterService from '@/lib/services/chapterService';
import { getErrorMessage } from '@/lib/utils';

interface ProjectParams {
  projectId: string;
}

export async function GET(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const chapters = await chapterService.getChapters(p.projectId, authContext.user.id);
      return NextResponse.json(chapters);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function POST(request: Request, { params }: { params: ProjectParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const newChapter = await chapterService.createChapter(
        p.projectId,
        authContext.user.id,
        jsonData
      );
      return NextResponse.json(newChapter, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
