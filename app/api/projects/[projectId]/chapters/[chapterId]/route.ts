import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as chapterService from '@/lib/services/chapterService';
import { getErrorMessage } from '@/lib/utils';

interface ChapterParams {
  projectId: string;
  chapterId: string;
}

export async function GET(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const chapter = await chapterService.getChapter(
        p.projectId,
        p.chapterId,
        authContext.user.id
      );
      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }
      return NextResponse.json(chapter);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      const jsonData = await req.json();
      const updatedChapter = await chapterService.updateChapter(
        p.projectId,
        p.chapterId,
        authContext.user.id,
        jsonData
      );
      return NextResponse.json(updatedChapter);
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request, { params }: { params: ChapterParams }) {
  return withProjectAuth(request, params, async (req, p, authContext) => {
    try {
      await chapterService.deleteChapter(
        p.projectId,
        p.chapterId,
        authContext.user.id
      );
      return NextResponse.json(
        { message: 'Chapter deleted successfully' },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
  });
}
