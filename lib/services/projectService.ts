// lib/services/projectService.ts
import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import { 
  type CreateProjectValues, 
  type UpdateProjectValues,
  createProjectSchema,
  updateProjectSchema
} from '../schemas/project.schema';
import type { Project, Genre } from '../types';
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
import { getChapters } from './chapterService';

/**
 * Fetches all projects for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of projects.
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects.');
  }
  return data || [];
}

/**
 * Fetches a single project by its ID after verifying user ownership, including word count.
 * @param projectId - The ID of the project.
 * @param userId - The ID of the user requesting the project.
 * @returns A promise that resolves to the project object with genre and word count, or null if not found.
 * @throws {Error} If ownership cannot be verified or on database error.
 */
export async function getProjectById(projectId: string, userId: string): Promise<(Project & { genres: Genre | null; wordCount: number }) | null> {
  const supabase = await createClient();
  
  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) {
    throw new Error(ownership.error.message);
  }

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`*, genres (*)`)
    .eq('id', projectId)
    .single();

  if (projectError || !projectData) {
    console.error(`Error fetching project details for ${projectId}:`, projectError);
    return null;
  }

  let totalWordCount = 0;
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id')
    .eq('project_id', projectId);

  if (chaptersError) {
    console.error(`Error fetching chapters for word count (project: ${projectId}):`, chaptersError);
  } else if (chapters && chapters.length > 0) {
    const chapterIds = chapters.map(c => c.id);
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('word_count')
      .in('chapter_id', chapterIds);
    
    if (scenesError) {
      console.error(`Error fetching scenes for word count (project: ${projectId}):`, scenesError);
    } else if (scenes) {
      totalWordCount = scenes.reduce((sum, scene) => sum + (scene.word_count || 0), 0);
    }
  }
  
  return {
    ...projectData,
    wordCount: totalWordCount
  };
}

/**
 * Creates a new project for a user.
 * @param userId - The ID of the user creating the project.
 * @param projectData - The data for the new project.
 * @returns A promise that resolves to the newly created project.
 */
export async function createProject(userId: string, projectData: CreateProjectValues): Promise<Project> {
  const validatedData = createProjectSchema.parse(projectData);
  const supabase = await createClient();

  const { data: newProject, error } = await supabase
    .from('projects')
    .insert({ ...validatedData, user_id: userId })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project.');
  }

  return newProject;
}

/**
 * Updates an existing project.
 * @param projectId - The ID of the project to update.
 * @param userId - The ID of the user making the update.
 * @param projectData - The data to update.
 * @returns A promise that resolves to the updated project.
 */
export async function updateProject(projectId: string, userId: string, projectData: UpdateProjectValues): Promise<Project> {
  const validatedData = updateProjectSchema.parse(projectData);
  const supabase = await createClient();

  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) {
    throw new Error(ownership.error.message);
  }

  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(validatedData)
    .eq('id', projectId)
    .select(`*, genres (*)`)
    .single();

  if (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw new Error('Failed to update project.');
  }
  
  return updatedProject;
}

/**
 * Deletes a project.
 * @param projectId - The ID of the project to delete.
 * @param userId - The ID of the user deleting the project.
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  const ownership = await verifyProjectOwnership(supabase, projectId, userId);
  if (ownership.error) {
    throw new Error(ownership.error.message);
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error(`Error deleting project ${projectId}:`, error);
    throw new Error('Failed to delete project.');
  }
}

function sanitizeText(text: string): string {
  if (!text) return '';
  // This regex removes characters that are invalid in XML, which docx files are.
   
  const invalidXMLCharsRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  return text.replace(invalidXMLCharsRegex, '');
}

export async function generateManuscriptDocx(projectId: string, userId: string): Promise<{ buffer: Buffer; filename: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("User not authenticated or does not match for DOCX generation.");
  }

  const project = await getProjectById(projectId, userId);
  const chapters = await getChapters(projectId, userId);

  if (!project || !chapters) {
    throw new Error('Project data not found');
  }

  const authorName = user.email || 'Author'; // Replace with profile name if available
  const authorLastName = authorName.split(' ')[0] || 'Author';
  const projectKeyword = project.title.split(' ')[0] || 'Manuscript';

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal', name: 'Normal', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, font: { ascii: 'Times New Roman', eastAsia: 'Times New Roman', hAnsi: 'Times New Roman' } },
          paragraph: { spacing: { line: 480, before: 0, after: 0 } },
        },
        {
          id: 'SceneBreak', name: 'Scene Break', basedOn: 'Normal', next: 'Normal',
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 } },
        },
      ],
    },
    sections: [
      { // Title Page Section
        properties: { page: { margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) } } },
        children: [
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(sanitizeText(authorName))] }),
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(sanitizeText(user.email || ''))] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`Approx. ${Math.round((project.wordCount || 0) / 100) * 100} words`)] }),
          new Paragraph({ children: [], spacing: { before: 2400 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sanitizeText(project.title) || 'Untitled', bold: true, size: 32 })] }),
          new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun(`by ${sanitizeText(authorName)}`)] }),
        ],
      },
      { // Main Content Section
        properties: {
          page: {
            margin: { top: convertInchesToTwip(1), right: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1) },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`${sanitizeText(authorLastName)} / ${sanitizeText(projectKeyword)} / `), new TextRun({ children: [PageNumber.CURRENT] })] }),
            ],
          }),
        },
        children: (() => {
          const allContent: Paragraph[] = [];
          chapters.sort((a, b) => a.order - b.order).forEach((chapter, chapterIndex) => {
            allContent.push(new Paragraph({ pageBreakBefore: chapterIndex > 0, alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 480 }, children: [new TextRun({ text: sanitizeText(chapter.title) || `Chapter ${chapterIndex + 1}`, bold: true })] }));
            const sortedScenes = chapter.scenes ? chapter.scenes.sort((a, b) => a.order - b.order) : [];
            if (sortedScenes.length > 0) {
              sortedScenes.forEach((scene, sceneIndex) => {
                const sanitizedContent = sanitizeText(scene.content || '');
                const lines = sanitizedContent.split('\n');
                lines.forEach((line) => {
                  if (line.trim() === '') { return; }
                  allContent.push(new Paragraph({ style: 'Normal', indent: { firstLine: convertInchesToTwip(0.5) }, children: [new TextRun(line)] }));
                });
                if (sceneIndex < sortedScenes.length - 1) {
                  allContent.push(new Paragraph({ style: 'SceneBreak', children: [new TextRun('#')] }));
                }
              });
            }
          });
          allContent.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480 }, children: [new TextRun('The End')] }));
          return allContent;
        })(),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeTitle = (project.title || 'Untitled').replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
  const filename = `${safeTitle}_Manuscript.docx`;

  return { buffer, filename };
}
