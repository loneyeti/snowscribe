// lib/data/projects.ts
"use server";
import * as projectService from "../services/projectService";
import { getAuthenticatedUser } from "../auth";
import type { Project, Genre } from "../types";

/**
 * Server Action to generate a DOCX file for a project and return it as a Base64 string.
 */
export async function exportProjectAsDocx(projectId: string): Promise<{ filename: string; content: string; error?: string }> {
  try {
    const user = await getAuthenticatedUser();
    const { buffer, filename } = await projectService.generateManuscriptDocx(projectId, user.id);
    const content = buffer.toString('base64');
    return { filename, content };
  } catch (error) {
    console.error("Error exporting project as DOCX:", error);
    return { filename: '', content: '', error: error instanceof Error ? error.message : 'Failed to generate document.' };
  }
}

/**
 * Gets a project by ID after verifying user ownership, including genre and word count
 */
export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null; wordCount: number }) | null> {
  const user = await getAuthenticatedUser();
  return projectService.getProjectById(projectId, user.id);
}

/**
 * Creates a new project
 */
export async function createProject(projectData: Parameters<typeof projectService.createProject>[1]): Promise<Project> {
  const user = await getAuthenticatedUser();
  return projectService.createProject(user.id, projectData);
}

/**
 * Updates an existing project
 */
export async function updateProject(projectId: string, projectData: Parameters<typeof projectService.updateProject>[2]): Promise<Project> {
  const user = await getAuthenticatedUser();
  return projectService.updateProject(projectId, user.id, projectData);
}

/**
 * Deletes a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  return projectService.deleteProject(projectId, user.id);
}

/**
 * Gets all projects for the authenticated user
 */
export async function getProjectsForUser(): Promise<Project[]> {
  const user = await getAuthenticatedUser();
  return projectService.getProjectsForUser(user.id);
}
