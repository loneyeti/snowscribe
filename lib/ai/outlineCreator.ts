"use server";

import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import type { ParsedOutlineData } from "@/lib/types/ai";
import { getProjectById } from "@/lib/data/projects";

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

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * Creates database entities from the parsed outline data by calling a single,
 * transactional database function.
 * @param projectId The ID of the project.
 * @param parsedData The outline data parsed from AI.
 * @returns Promise resolving when complete.
 * @throws An error if the RPC call fails, ensuring the calling function can handle it.
 */
export async function createEntitiesFromOutline(
  projectId: string,
  parsedData: ParsedOutlineData
): Promise<void> {
  // 1. Get the current user and a Supabase client instance.
  const user = await getAuthenticatedUser();
  const supabase = await createClient();

  // 2. Call the 'create_full_outline' database function via RPC.
  //    This function handles all database insertions within a single transaction.
  const { error } = await supabase.rpc('create_full_outline', {
    p_project_id: projectId,
    p_user_id: user.id,
    outline_data: parsedData,
  });

  // 3. Check for errors from the RPC call.
  //    If an error occurred, the transaction was automatically rolled back in the database.
  if (error) {
    console.error("Error calling create_full_outline RPC:", error);
    // Throw a user-friendly error to be caught by the UI.
    throw new Error(
      `Failed to create outline in database: ${error.message}`
    );
  }

  // If we reach here, the transaction was successful.
  console.log(`Successfully created full outline for project ${projectId}`);
}
