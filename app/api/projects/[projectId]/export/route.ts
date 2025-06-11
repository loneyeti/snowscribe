import { NextResponse } from 'next/server';
import { withProjectAuth } from '@/lib/api/utils';
import * as projectService from '@/lib/services/projectService';
import { getErrorMessage } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  return withProjectAuth(request, async () => params, async (req, p, authContext) => {
    try {
      const { buffer, filename } = await projectService.generateManuscriptDocx(p.projectId, authContext.user.id);
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Error generating DOCX file via API:', error);
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to generate document',
          details: getErrorMessage(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
}
