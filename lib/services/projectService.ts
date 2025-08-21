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
import { getChaptersWithScenes } from './chapterService';

/**
 * Fetches all projects for a given user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of projects.
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*, word_count') // Include word_count column
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects.');
  }
  // Map the snake_case word_count to camelCase wordCount
  return (data || []).map(({ word_count, ...p }) => ({ ...p, wordCount: word_count ?? 0 }));
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

  // Select the word_count column directly
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(`*, genres (*), word_count`) // Include word_count column
    .eq('id', projectId)
    .single();

  if (projectError || !projectData) {
    console.error(`Error fetching project details for ${projectId}:`, projectError);
    return null;
  }
  
  // Map the snake_case word_count to camelCase wordCount
  const { word_count, ...rest } = projectData;
  
  return {
    ...rest,
    wordCount: word_count ?? 0
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
    .select('*, word_count') // Include word_count column
    .single();
    
  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project.');
  }

  // Map the snake_case word_count to camelCase wordCount
  const { word_count, ...rest } = newProject;
  return { ...rest, wordCount: word_count ?? 0 };
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
    .select(`*, genres (*), word_count`) // Include word_count column
    .single();

  if (error) {
    console.error(`Error updating project ${projectId}:`, error);
    throw new Error('Failed to update project.');
  }
  
  // Map the snake_case word_count to camelCase wordCount
  const { word_count, ...rest } = updatedProject;
  return { ...rest, wordCount: word_count ?? 0 };
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

  // Fetch user profile to get full_name and pen_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, pen_name')
    .eq('id', user.id)
    .single();

  const project = await getProjectById(projectId, userId);
  const chapters = await getChaptersWithScenes(projectId, userId);

  if (!project || !chapters) {
    throw new Error('Project data not found');
  }

  // Determine the name for the top-left contact info (real name)
  const contactName = profile?.full_name || '';

  // Determine the name for the "by" line on the title page
  // Priority: Pen Name > Real Name > Email
  const bylineName = profile?.pen_name || profile?.full_name || user.email || 'Author';

  // Determine the last name for the page header from the byline name
  const nameParts = bylineName.split(' ');
  const authorLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : bylineName;
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
          // Conditionally add the real name to the top left if it exists
          ...(contactName ? [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(sanitizeText(contactName))] })] : []),
          
          // Always add the email to the top left
          new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun(sanitizeText(user.email || ''))] }),
          
          // Word count
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(`Approx. ${Math.round((project.wordCount || 0) / 100) * 100} words`)] }),
          
          // Spacer
          new Paragraph({ children: [], spacing: { before: 2400 } }),
          
          // Title
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sanitizeText(project.title) || 'Untitled', bold: true, size: 32 })] }),
          
          // Byline using the correct bylineName
          new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER, children: [new TextRun(`by ${sanitizeText(bylineName)}`)] }),
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
