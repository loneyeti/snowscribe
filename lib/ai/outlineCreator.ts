"use server";

import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import type { ParsedOutlineData, ParsedScene, ParsedChapter } from "@/lib/types/ai";
import type { Character, Scene, SceneTag, Chapter as ProjectChapter } from "@/lib/types";
import { getProjectById } from "@/lib/data/projects";
import { createCharacter } from "@/lib/data/characters";
import { createChapter } from "@/lib/data/chapters";
import { createScene, updateScene, updateSceneCharacters, updateSceneTags } from "@/lib/data/scenes";
import { createSceneTag } from "@/lib/data/sceneTags";

/**
 * Generates an outline from a synopsis using AI and parses the JSON response.
 * @param projectId The ID of the project.
 * @returns A Promise resolving to ParsedOutlineData or null if an error occurs.
 */
export async function generateAndParseOutline(projectId: string): Promise<ParsedOutlineData | null> {
  try {
    const project = await getProjectById(projectId);
    if (!project || !project.one_page_synopsis) {
      console.error("Project or one-page synopsis not found for ID:", projectId);
      throw new Error("Project synopsis is missing.");
    }

    const synopsis = project.one_page_synopsis;
    const toolName = "outline_json_generator";
    const aiResponse = await AISMessageHandler(projectId, toolName, synopsis, { synopsis });

    if (aiResponse.content && aiResponse.content.length > 0 && aiResponse.content[0].type === "text") {
      const jsonText = (aiResponse.content[0] as import("snowgander").TextBlock).text;
      const cleanedJsonText = jsonText.replace(/^```json\s*|\s*```$/g, "");
      try {
        const parsedData = JSON.parse(cleanedJsonText) as ParsedOutlineData;
        if (!parsedData.characters || !parsedData.chapters) {
          throw new Error("Parsed JSON does not match expected ParsedOutlineData structure.");
        }
        return parsedData;
      } catch (e: unknown) {
        console.error("Failed to parse AI JSON response:", e, "Raw JSON:", cleanedJsonText);
        throw new Error("AI returned invalid JSON for the outline.");
      }
    } else if (aiResponse.content && aiResponse.content.length > 0 && aiResponse.content[0].type === "error") {
      const errorBlock = aiResponse.content[0] as import("snowgander").ErrorBlock;
      console.error("AI service returned an error for outline generation:", errorBlock.publicMessage, errorBlock.privateMessage);
      throw new Error(errorBlock.publicMessage || "AI service failed to generate outline.");
    }

    console.error("AI did not return usable text content for outline generation.");
    throw new Error("AI did not return usable outline data.");
  } catch (error) {
    console.error("Error in generateAndParseOutline:", error);
    throw error;
  }
}

// Helper function to get or create a scene tag
async function getOrCreateTag(projectId: string, tagName: string, existingTags: SceneTag[]): Promise<SceneTag> {
  const normalizedTagName = tagName.trim().toLowerCase();
  const foundTag = existingTags.find(tag => tag.name.trim().toLowerCase() === normalizedTagName && (tag.project_id === projectId || tag.project_id === null));
  if (foundTag) {
    return foundTag;
  }

  // Create new project-specific tag using server action
  try {
    const newTag = await createSceneTag(projectId, tagName.trim());
    existingTags.push(newTag);
    return newTag;
  } catch (error) {
    throw new Error(`Failed to create tag "${tagName}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates database entities from the parsed outline data.
 * @param projectId The ID of the project.
 * @param parsedData The outline data parsed from AI.
 * @param existingTags All existing scene tags (global and project-specific).
 * @returns Promise resolving when complete.
 */
export async function createEntitiesFromOutline(
  projectId: string,
  parsedData: ParsedOutlineData,
  existingTags: SceneTag[]
): Promise<void> {
  const createdCharactersMap = new Map<string, Character>();

  // 1. Create Characters
  for (const pChar of parsedData.characters) {
    try {
      const newChar = await createCharacter(projectId, {
        name: pChar.name,
        description: pChar.description || "",
      });
      createdCharactersMap.set(pChar.name, newChar);
    } catch (error) {
      console.warn(`Failed to create character "${pChar.name}":`, error, `Skipping this character.`);
    }
  }

  // 2. Create Chapters and Scenes
  for (const pChapter of parsedData.chapters.sort((a: ParsedChapter, b: ParsedChapter) => a.order - b.order)) {
    let newChapter: ProjectChapter | null = null;
    try {
      newChapter = await createChapter(projectId, {
        title: pChapter.title,
        order: pChapter.order
      });
    } catch (error) {
      console.warn(`Failed to create chapter "${pChapter.title}":`, error, `Skipping this chapter and its scenes.`);
      continue;
    }

    if (newChapter) {
      for (const pScene of pChapter.scenes.sort((a: ParsedScene, b: ParsedScene) => a.order - b.order)) {
        let newScene: Scene | null = null;
        try {
          if (!pScene.primaryCategory) {
            console.warn(`Scene "${pScene.title}" missing primaryCategory, defaulting to 'Transition'.`);
            pScene.primaryCategory = "Transition";
          }

          newScene = await createScene(projectId, newChapter.id, {
            title: pScene.title,
            order: pScene.order,
            primary_category: pScene.primaryCategory
          });

          if (newScene) {
            const updatePayload: Partial<Scene> = {};
            if (pScene.description) {
              updatePayload.outline_description = pScene.description;
            }
            if (pScene.povCharacterName && createdCharactersMap.has(pScene.povCharacterName)) {
              updatePayload.pov_character_id = createdCharactersMap.get(pScene.povCharacterName)!.id;
            }
            if (Object.keys(updatePayload).length > 0) {
              const filteredPayload = Object.fromEntries(
                Object.entries(updatePayload).filter(([, v]) => v !== null && v !== undefined)
              );
              newScene = await updateScene(projectId, newChapter.id, newScene.id, filteredPayload);
            }

            if (pScene.otherCharacterNames && pScene.otherCharacterNames.length > 0) {
              const characterIdsToLink = pScene.otherCharacterNames
                .map(name => createdCharactersMap.get(name)?.id)
                .filter((id): id is string => !!id);
              if (characterIdsToLink.length > 0) {
                await updateSceneCharacters(projectId, newScene.id, characterIdsToLink);
              }
            }

            if (pScene.tagNames && pScene.tagNames.length > 0) {
              const tagIdsToLink: string[] = [];
              for (const tagName of pScene.tagNames) {
                try {
                  const tag = await getOrCreateTag(projectId, tagName, existingTags);
                  tagIdsToLink.push(tag.id);
                } catch (tagError) {
                  console.warn(`Failed to get or create tag "${tagName}":`, tagError);
                }
              }
              if (tagIdsToLink.length > 0) {
                await updateSceneTags(projectId, newScene.id, tagIdsToLink);
              }
            }
          }
        } catch (sceneError) {
          console.warn(`Failed to process scene "${pScene.title}":`, sceneError, `Skipping this scene.`);
        }
      }
    }
  }
  console.log("Entities created from outline successfully.");
}
