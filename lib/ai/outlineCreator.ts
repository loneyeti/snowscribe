"use server";

import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import type { ParsedOutlineData, ParsedScene, ParsedChapter } from "@/lib/types/ai";
import type { Character, Scene, SceneTag, Chapter as ProjectChapter } from "@/lib/types";
import { getProjectById } from "@/lib/data/projects";
import { createCharacter } from "@/lib/data/characters";
import { updateScene, updateSceneCharacters, updateSceneTags } from "@/lib/data/scenes";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Helper to get cookie header for server-side fetch
async function getAuthCookieHeader(): Promise<string> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.getAll().map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`).join('; ');
}

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
    const toolName = "outline_json_generator"; // This tool name must be configured in tool_model and ai_prompts

    // AISMessageHandler.sendMessage expects projectId, toolName, userPrompt, contextData (optional), history (optional)
    // For this tool, the synopsis is the primary "userPrompt" or context.
    // The system prompt (fetched by AISMessageHandler via toolName) will guide the JSON generation.
    const aiResponse = await AISMessageHandler(projectId, toolName, synopsis, { synopsis });

    if (aiResponse.content && aiResponse.content.length > 0 && aiResponse.content[0].type === "text") {
      const jsonText = (aiResponse.content[0] as import("snowgander").TextBlock).text;
      // Clean the JSON text: The AI might sometimes wrap the JSON in markdown ```json ... ```
      const cleanedJsonText = jsonText.replace(/^```json\s*|\s*```$/g, "");
      try {
        const parsedData = JSON.parse(cleanedJsonText) as ParsedOutlineData;
        // Basic validation of parsed structure (can be more thorough)
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
    // Re-throw or handle as appropriate for UI display
    throw error; // Let the caller handle UI notification
  }
}

// Helper function to get or create a scene tag
async function getOrCreateTag(projectId: string, tagName: string, existingTags: SceneTag[], cookieHeader: string): Promise<SceneTag> {
  const normalizedTagName = tagName.trim().toLowerCase();
  const foundTag = existingTags.find(tag => tag.name.trim().toLowerCase() === normalizedTagName && (tag.project_id === projectId || tag.project_id === null));
  if (foundTag) {
    return foundTag;
  }

  // Create new project-specific tag
  const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/scene-tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader && { 'Cookie': cookieHeader }),
    },
    body: JSON.stringify({ name: tagName.trim(), project_id: projectId }), // API needs to handle this
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create tag "${tagName}"`);
  }
  const newTag = await response.json() as SceneTag;
  existingTags.push(newTag); // Add to local cache for subsequent checks in this run
  return newTag;
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
  const cookieHeader = await getAuthCookieHeader();
  const createdCharactersMap = new Map<string, Character>(); // Map AI-generated name to created Character object

  // 1. Create Characters
  for (const pChar of parsedData.characters) {
    try {
      const newChar = await createCharacter(projectId, {
        name: pChar.name,
        description: pChar.description || "",
        // Other fields like notes, image_url can be defaulted or left empty
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
      const chapterResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookieHeader && { 'Cookie': cookieHeader }),
        },
        body: JSON.stringify({ title: pChapter.title, order: pChapter.order, project_id: projectId }),
      });
      if (!chapterResponse.ok) throw new Error(`Failed to create chapter "${pChapter.title}"`);
      newChapter = await chapterResponse.json() as ProjectChapter;
    } catch (error) {
      console.warn(`Failed to create chapter "${pChapter.title}":`, error, `Skipping this chapter and its scenes.`);
      continue; // Skip to next chapter if creation fails
    }

    if (newChapter) {
      for (const pScene of pChapter.scenes.sort((a: ParsedScene, b: ParsedScene) => a.order - b.order)) {
        let newScene: Scene | null = null;
        try {
          // primary_category is required by createSceneSchema
          if (!pScene.primaryCategory) {
            console.warn(`Scene "${pScene.title}" missing primaryCategory, defaulting to 'Transition'.`);
            pScene.primaryCategory = "Transition";
          }

          const scenePayload = {
            title: pScene.title,
            order: pScene.order,
            primary_category: pScene.primaryCategory, // Now required
            // outline_description can be added here if API supports it, or via update below
            // pov_character_id can be added here if API supports it, or via update below
            project_id: projectId, // Required by createSceneSchema
            chapter_id: newChapter.id, // Required by createSceneSchema
          };

          const sceneResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}/chapters/${newChapter.id}/scenes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(cookieHeader && { 'Cookie': cookieHeader }),
            },
            body: JSON.stringify(scenePayload),
          });
          if (!sceneResponse.ok) throw new Error(`Failed to create scene "${pScene.title}"`);
          newScene = await sceneResponse.json() as Scene;

          // Update scene with description and POV character if newScene was created
          if (newScene) {
            const updatePayload: Partial<Scene> = {};
            if (pScene.description) {
              updatePayload.outline_description = pScene.description;
            }
            if (pScene.povCharacterName && createdCharactersMap.has(pScene.povCharacterName)) {
              updatePayload.pov_character_id = createdCharactersMap.get(pScene.povCharacterName)!.id;
            }
            if (Object.keys(updatePayload).length > 0) {
              // Remove keys with null or undefined values to satisfy updateScene type
              const filteredPayload = Object.fromEntries(
                Object.entries(updatePayload).filter(([, v]) => v !== null && v !== undefined)
              );
              newScene = await updateScene(projectId, newChapter.id, newScene.id, filteredPayload);
            }

            // Link other characters
            if (pScene.otherCharacterNames && pScene.otherCharacterNames.length > 0) {
              const characterIdsToLink = pScene.otherCharacterNames
                .map((name: string) => createdCharactersMap.get(name)?.id)
                .filter((id): id is string => !!id);
              if (characterIdsToLink.length > 0) {
                await updateSceneCharacters(projectId, newScene.id, characterIdsToLink);
              }
            }

            // Link tags
            if (pScene.tagNames && pScene.tagNames.length > 0) {
              const tagIdsToLink: string[] = [];
              for (const tagName of pScene.tagNames) {
                try {
                  const tag = await getOrCreateTag(projectId, tagName, existingTags, cookieHeader);
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
