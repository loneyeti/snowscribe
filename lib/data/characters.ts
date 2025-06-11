"use server";
import type { Character, CharacterFormValues } from "@/lib/types";
import * as characterService from "@/lib/services/characterService";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getCharacters(projectId: string): Promise<Character[]> {
  try {
    const user = await getAuthenticatedUser();
    return await characterService.getCharacters(projectId, user.id);
  } catch (error) {
    console.error(`Error in getCharacters Server Action for project ${projectId}:`, error);
    return [];
  }
}

export async function getCharacter(
  projectId: string, 
  characterId: string
): Promise<Character | null> {
  try {
    const user = await getAuthenticatedUser();
    return await characterService.getCharacter(projectId, characterId, user.id);
  } catch (error) {
    console.error(
      `Error in getCharacter Server Action for character ${characterId}:`, 
      error
    );
    return null;
  }
}

export async function createCharacter(
  projectId: string, 
  characterData: CharacterFormValues
): Promise<Character> {
  const user = await getAuthenticatedUser();
  return characterService.createCharacter(projectId, user.id, characterData);
}

export async function updateCharacter(
  projectId: string,
  characterId: string,
  characterData: Partial<CharacterFormValues>
): Promise<Character> {
  const user = await getAuthenticatedUser();
  return characterService.updateCharacter(
    projectId, 
    characterId, 
    user.id, 
    characterData
  );
}

export async function deleteCharacter(projectId: string, characterId: string): Promise<void> {
  const user = await getAuthenticatedUser();
  await characterService.deleteCharacter(projectId, characterId, user.id);
}
