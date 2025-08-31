// This is a server-side only module
'use server';

import type { Chapter } from "@/lib/types";
import * as chapterService from "@/lib/services/chapterService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getChapters(projectId: string): Promise<Chapter[]> {
  try {
    const user = await getAuthenticatedUser();
    return await chapterService.getChapters(projectId, user.id);
  } catch (error) {
    console.error(`Error in getChapters Server Action for project ${projectId}:`, error);
    return [];
  }
}

export async function getChaptersWithScenes(projectId: string): Promise<Chapter[]> {
  const user = await getAuthenticatedUser();
  return chapterService.getChaptersWithScenes(projectId, user.id);
}

export async function getChapter(
  projectId: string, 
  chapterId: string
): Promise<Chapter | null> {
  try {
    const user = await getAuthenticatedUser();
    return await chapterService.getChapter(projectId, chapterId, user.id);
  } catch (error) {
    console.error(`Error in getChapter Server Action for chapter ${chapterId}:`, error);
    return null;
  }
}

// Add this new function to lib/data/chapters.ts

export async function getChapterWithScenesById(projectId: string, chapterId: string): Promise<Chapter | null> {
  const user = await getAuthenticatedUser();
  return chapterService.getChapterWithScenesById(projectId, chapterId, user.id);
}

export async function createChapter(
  projectId: string, 
  chapterData: { title: string; order?: number }
): Promise<Chapter> {
  const user = await getAuthenticatedUser();
  const createData = {
    title: chapterData.title,
    order: chapterData.order,
    project_id: projectId
  };
  return chapterService.createChapter(projectId, user.id, createData);
}

export async function updateChapter(
  projectId: string,
  chapterId: string,
  chapterData: { title?: string; order?: number }
): Promise<Chapter> {
  const user = await getAuthenticatedUser();
  return chapterService.updateChapter(
    projectId, 
    chapterId, 
    user.id, 
    chapterData
  );
}

export async function deleteChapter(projectId: string, chapterId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await chapterService.deleteChapter(projectId, chapterId, user.id);
}

export const getChaptersByProjectId = getChapters;

export async function reorderChapters(projectId: string, chapters: { id: string; order: number }[]): Promise<void> {
  const user = await getAuthenticatedUser();
  await chapterService.reorderChapters(projectId, user.id, chapters);
}
