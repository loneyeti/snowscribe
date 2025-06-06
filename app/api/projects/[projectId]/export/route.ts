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
  PageNumber, // Ensure PageNumber is imported
  convertInchesToTwip,
  NumberFormat,
} from 'docx';

// NEW: Sanitizer function to remove invalid characters from text
// NEW (Improved): Sanitizer function that only removes invalid XML characters
function sanitizeText(text: string): string {
  if (!text) return '';

  // This regex targets invalid XML characters:
  // U+0000 to U+0008 (null and other C0 controls)
  // U+000B to U+000C (vertical tab, form feed)
  // U+000E to U+001F (other C0 controls)
  // U+007F (delete)
  // It specifically allows U+0009 (tab), U+000A (newline), and U+000D (carriage return).
  // This preserves all valid characters, including em-dashes, smart quotes, and accented letters.
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
    // const profile = await getUserProfile(user.id); // Not used in doc, can be removed if not needed elsewhere

    if (!project || !chapters) {
      return new NextResponse(
        JSON.stringify({ error: 'Project data not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const authorName = user.email || 'Author'; // Assuming user.email is the full name for this logic
    const authorLastName = authorName.split(' ')[0] || 'Author'; // Use first part of email or name
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
              // FIX: The font property in a style must be an object
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
        ],
      },
      sections: [
        // Title Page Section
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
              // FIX: Sanitize all text inputs
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
        // Main Manuscript Section
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
                  // FIX: Correctly implement the page number field
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

                if (chapter.scenes && chapter.scenes.length > 0) {
                  chapter.scenes
                    .sort((a, b) => a.order - b.order)
                    .forEach((scene) => {
                      // FIX: Sanitize scene content before splitting
                      const lines = sanitizeText(scene.content || '').split('\n');
                      lines.forEach((line) => {
                        if (line.trim() === '') {
                          return;
                        }

                        if (line.trim() === '#') {
                          allContent.push(
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              spacing: { after: 480, before: 480 },
                              children: [new TextRun('#')],
                            })
                          );
                        } else {
                          allContent.push(
                            new Paragraph({
                              style: 'Normal', // Explicitly use the defined style
                              indent: { firstLine: convertInchesToTwip(0.5) },
                              children: [new TextRun(line)], // line is already sanitized
                            })
                          );
                        }
                      });
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