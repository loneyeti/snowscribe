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
