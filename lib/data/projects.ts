"use server";
import type { Project, Genre } from "@/lib/types";
import type { CreateProjectValues, UpdateProjectValues } from "@/lib/schemas/project.schema";
import * as projectService from "@/lib/services/projectService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getProjectById(projectId: string): Promise<(Project & { genres: Genre | null; wordCount: number }) | null> {
  if (!projectId) {
    console.error("getProjectById called with no projectId");
    return null;
  }

  try {
    const user = await getAuthenticatedUser();
    return await projectService.getProjectById(projectId, user.id);
  } catch (error) {
    console.error(`Error in getProjectById Server Action for project ${projectId}:`, error);
    return null;
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!projectId) {
    throw new Error("Project ID is required to delete a project.");
  }

  try {
    const user = await getAuthenticatedUser();
    await projectService.deleteProject(projectId, user.id);
  } catch (error) {
    console.error(`Error in deleteProject Server Action for project ${projectId}:`, error);
    throw error;
  }
}

export async function createProject(projectData: CreateProjectValues): Promise<Project> {
  const user = await getAuthenticatedUser();
  return projectService.createProject(user.id, projectData);
}

export async function updateProject(projectId: string, projectData: UpdateProjectValues): Promise<Project> {
  const user = await getAuthenticatedUser();
  return projectService.updateProject(projectId, user.id, projectData);
}
