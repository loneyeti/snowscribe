import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProjectById } from '@/lib/data/projects';
import { getChaptersByProjectId } from '@/lib/data/chapters';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  PageNumber,
  convertInchesToTwip,
  NumberFormat,
} from 'docx';

// Sanitizer function to remove invalid characters from text
function sanitizeText(text: string): string {
  if (!text) return '';
  const invalidXMLCharsRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  return text.replace(invalidXMLCharsRegex, '');
}

export async function POST(
  request: Request,
  { params }: { params: { projectId:string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { projectId } = params;
    const project = await getProjectById(projectId);
    const chapters = await getChaptersByProjectId(projectId);

    if (!project || !chapters) {
      return new NextResponse(
        JSON.stringify({ error: 'Project data not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const authorName = user.email || 'Author';
    const authorLastName = authorName.split(' ')[0] || 'Author';
    const projectKeyword = project.title.split(' ')[0] || 'Manuscript';

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              size: 24, // 12pt
              font: {
                ascii: 'Times New Roman',
                eastAsia: 'Times New Roman',
                hAnsi: 'Times New Roman',
              },
            },
            paragraph: {
              spacing: {
                line: 480, // Double spacing
                before: 0,
                after: 0,
              },
            },
          },
          {
            id: 'SceneBreak',
            name: 'Scene Break',
            basedOn: 'Normal',
            next: 'Normal',
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 240,
                after: 240
              },
            },
          },
        ],
      },
      sections: [
        // FIX: The complete title page section is restored here.
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun(sanitizeText(authorName))],
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [new TextRun(sanitizeText(user.email || ''))],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun(
                  `Approx. ${
                    Math.round((project.wordCount || 0) / 100) * 100
                  } words`
                ),
              ],
            }),
            new Paragraph({
              children: [],
              spacing: { before: 2400 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: sanitizeText(project.title) || 'Untitled',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 240 },
              alignment: AlignmentType.CENTER,
              children: [new TextRun(`by ${sanitizeText(authorName)}`)],
            }),
          ],
        },
        // Main Manuscript Section (with the correct scene break logic)
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun(
                      `${sanitizeText(authorLastName)} / ${sanitizeText(projectKeyword)} / `
                    ),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: (() => {
            const allContent: Paragraph[] = [];

            chapters
              .sort((a, b) => a.order - b.order)
              .forEach((chapter, chapterIndex) => {
                allContent.push(
                  new Paragraph({
                    pageBreakBefore: chapterIndex > 0,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2400, after: 480 },
                    children: [
                      new TextRun({
                        text:
                          sanitizeText(chapter.title) ||
                          `Chapter ${chapterIndex + 1}`,
                        bold: true,
                      }),
                    ],
                  })
                );

                const sortedScenes = chapter.scenes
                  ? chapter.scenes.sort((a, b) => a.order - b.order)
                  : [];

                if (sortedScenes.length > 0) {
                  sortedScenes.forEach((scene, sceneIndex) => {
                    const sanitizedContent = sanitizeText(scene.content || '');
                    const lines = sanitizedContent.split('\n');

                    lines.forEach((line) => {
                      if (line.trim() === '') {
                        return;
                      }
                      allContent.push(
                        new Paragraph({
                          style: 'Normal',
                          indent: { firstLine: convertInchesToTwip(0.5) },
                          children: [new TextRun(line)],
                        })
                      );
                    });

                    if (sceneIndex < sortedScenes.length - 1) {
                      allContent.push(
                        new Paragraph({
                          style: 'SceneBreak',
                          children: [new TextRun('#')],
                        })
                      );
                    }
                  });
                }
              });

            allContent.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 480 },
                children: [new TextRun('The End')],
              })
            );

            return allContent;
          })(),
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeTitle = (project.title || 'Untitled')
      .replace(/[^a-zA-Z0-9-_ ]/g, '')
      .replace(/\s+/g, '_');
    const filename = `${safeTitle}_Manuscript.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating DOCX file:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}