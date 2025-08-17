"use server";

import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import type { ChatResponse as SnowganderChatResponse } from "snowgander";

// Define the structure we expect from the AI
interface NoteSuggestions {
  title: string;
  category: string;
}

interface NoteTitleSuggestion {
  title: string;
}

function isNoteTitleSuggestion(obj: unknown): obj is NoteTitleSuggestion {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    const potentialSuggestion = obj as Record<string, unknown>;
    return typeof potentialSuggestion.title === 'string';
}

/**
 * A type guard to safely check if an object matches the NoteSuggestions interface.
 * @param obj The object to check, typed as `unknown` for type safety.
 * @returns `true` if the object is a valid NoteSuggestions, `false` otherwise.
 */
function isNoteSuggestions(obj: unknown): obj is NoteSuggestions {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    // Cast to a generic object to safely check properties
    const potentialSuggestion = obj as Record<string, unknown>;
    return (
        typeof potentialSuggestion.title === 'string' &&
        typeof potentialSuggestion.category === 'string'
    );
}

export async function getNoteSuggestions(
  projectId: string,
  content: string
): Promise<NoteSuggestions> {
  // REMOVED: The hardcoded systemPrompt variable is no longer needed.
  // AISMessageHandler will fetch it from the database using the toolName.

  const userPrompt = `Here is the content for the world note:\n\n---\n\n${content}\n\n---\n\nPlease generate a title and category for this content.`;

  try {
    // UPDATED: The systemPrompt argument has been removed from this call.
    // AISMessageHandler now handles this internally.
    const response: SnowganderChatResponse = await AISMessageHandler(
      projectId,
      AI_TOOL_NAMES.WORLD_NOTE_SUGGESTER,
      userPrompt,
      null // No additional context needed
    );

    if (response.content && response.content[0]?.type === "text") {
      const responseText = (response.content[0] as { text: string }).text;
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }

      const parsedJson = JSON.parse(jsonMatch[0]);

      if (isNoteSuggestions(parsedJson)) {
        return parsedJson;
      } else {
        throw new Error("AI response JSON has an incorrect structure.");
      }
    } else {
      const errorMsg =
        (response.content?.[0] as { publicMessage?: string })?.publicMessage ||
        "The AI service returned an unexpected response.";
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Failed to get note suggestions:", error);
    // Return a default empty object on failure so the UI doesn't break
    return {
      title: "",
      category: "",
    };
  }
}

export async function generateNoteTitleForContent(
  projectId: string,
  content: string,
  category: string
): Promise<NoteTitleSuggestion> {
  const userPrompt = `The category for this world note is "${category}". Based on this category and the content below, please generate a concise and relevant title.\n\n---\n\n${content}\n\n---\n\nPlease return ONLY a JSON object with a "title" key. For example: { "title": "Generated Title" }`;
  
  try {
    const response: SnowganderChatResponse = await AISMessageHandler(
      projectId,
      AI_TOOL_NAMES.WORLD_NOTE_SUGGESTER,
      userPrompt,
      null
    );

    if (response.content && response.content[0]?.type === "text") {
      const responseText = (response.content[0] as { text: string }).text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI response did not contain a valid JSON object.");
      }

      const parsedJson = JSON.parse(jsonMatch[0]);
      if (isNoteTitleSuggestion(parsedJson)) {
        return parsedJson;
      } else {
          if (isNoteSuggestions(parsedJson)) {
              return { title: parsedJson.title };
          }
        throw new Error("AI response JSON has an incorrect structure.");
      }
    } else {
      const errorMsg =
        (response.content?.[0] as { publicMessage?: string })?.publicMessage ||
        "The AI service returned an unexpected response.";
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Failed to get note title suggestion:", error);
    return {
      title: "", // Return a default empty title on failure
    };
  }
}
