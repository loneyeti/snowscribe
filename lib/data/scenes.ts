"use server";
import type { Scene } from "../types";
import type { UpdateSceneValues } from "../schemas/scene.schema";
import * as sceneService from "../services/sceneService";
import { getAuthenticatedUser } from "../auth";

export async function getScenesByChapterId(projectId: string, chapterId: string): Promise<Scene[]> {
    const user = await getAuthenticatedUser();
    return sceneService.getScenesByChapterId(projectId, chapterId, user.id);
}

export async function updateScene(projectId: string, chapterId: string, sceneId: string, data: UpdateSceneValues): Promise<Scene> {
    const user = await getAuthenticatedUser();
    return sceneService.updateScene(projectId, chapterId, sceneId, user.id, data);
}

export async function updateSceneCharacters(projectId: string, sceneId: string, characterIds: string[]): Promise<void> {
    const user = await getAuthenticatedUser();
    await sceneService.updateSceneCharacters(projectId, sceneId, user.id, characterIds);
}

export async function updateSceneTags(projectId: string, sceneId: string, tagIds: string[]): Promise<void> {
    const user = await getAuthenticatedUser();
    await sceneService.updateSceneTags(projectId, sceneId, user.id, tagIds);
}

export async function createScene(
  projectId: string,
  chapterId: string,
  sceneData: { title: string; content?: string; order?: number; primary_category?: string }
): Promise<Scene> {
  const user = await getAuthenticatedUser();
  return sceneService.createScene(projectId, chapterId, user.id, sceneData);
}

export async function reorderScenesInChapter(projectId: string, chapterId: string, scenes: { id: string; order: number }[]): Promise<void> {
    const user = await getAuthenticatedUser();
    await sceneService.reorderScenes(projectId, chapterId, user.id, scenes);
}

export async function deleteScene(
  projectId: string,
  chapterId: string,
  sceneId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  await sceneService.deleteScene(projectId, chapterId, sceneId, user.id);
}

export async function moveScene(
  projectId: string,
  sceneId: string,
  newChapterId: string
): Promise<Scene> {
  const user = await getAuthenticatedUser();
  return sceneService.moveScene(projectId, user.id, sceneId, newChapterId);
}
