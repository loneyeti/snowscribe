"use server";

import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import type { ChatResponse as SnowganderChatResponse } from "snowgander";

// Define the structure we expect from the AI
interface NoteSuggestions {
  title: string;
  category: string;
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