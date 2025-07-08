// lib/ai/AISMessageHandler.ts
"use server"; // Mark as a server module

import { getToolModelByName } from '@/lib/data/toolModels';
import { getAIModelById } from '@/lib/data/aiModels';
// getAIVendorById is used internally by lib/data/chat.ts, so not directly needed here for the call.
import { getSystemPromptByCategory } from '@/lib/data/aiPrompts';
import { chat as snowganderChatService } from '@/lib/data/chat';
import { incrementUserCredits } from '@/lib/data/credits';
import { createClient } from '@/lib/supabase/server';
import type { AIModel } from '@/lib/types';
import type { ChatResponse as SnowganderChatResponse } from 'snowgander';
import type { Chapter, Character, Scene, SceneTag, WorldBuildingNote } from '@/lib/types';

/**
 * Sends a message to the AI service using a specified tool configuration.
 * @param projectId - The ID of the current project for logging and context.
 * @param toolName - Identifies the AI tool being used (maps to tool_model.name and ai_prompts.category).
 * @param userPrompt - The user's current text input.
 * @param contextData - Project-specific data for context formatting (structure depends on toolName).
 * @param conversationHistory - Array of SnowganderChatResponse objects for multi-turn context.
 * @returns A Promise resolving to a SnowganderChatResponse.
 */
export async function sendMessage(
  projectId: string,
  toolName: string,
  userPrompt: string,
  contextData?: unknown,
  conversationHistory: SnowganderChatResponse[] = []
): Promise<SnowganderChatResponse> {

  try {
    // 1. Fetch Tool-Specific Configuration
    const toolModelEntry = await getToolModelByName(toolName);
    if (!toolModelEntry || !toolModelEntry.model_id) {
      const errorMsg = `Tool model configuration for '${toolName}' not found or model_id missing: ${JSON.stringify(toolModelEntry)}`;
      console.error(`[AISMessageHandler] ${errorMsg}`);
      return {
        role: 'assistant',
        content: [{ type: 'error', publicMessage: `Configuration for AI tool '${toolName}' is missing or incomplete.`, privateMessage: errorMsg }]
      };
    }
    const aiModelId = toolModelEntry.model_id;

    const aiModelDetails: AIModel | null = await getAIModelById(aiModelId);
    if (!aiModelDetails) {
      const errorMsg = `AI model details for ID '${aiModelId}' (tool: ${toolName}) not found.`;
      console.error(`[AISMessageHandler] ${errorMsg}`);
      return {
        role: 'assistant',
        content: [{ type: 'error', publicMessage: `AI model for tool '${toolName}' could not be loaded.`, privateMessage: errorMsg }]
      };
    }

    const systemPromptText = await getSystemPromptByCategory(toolName);
    const finalSystemPrompt = systemPromptText || "You are a helpful AI assistant. Please provide concise and relevant information.";


    // 2. Prepare Context String
    let formattedContext = "";
    if (contextData && typeof contextData === 'object' && contextData !== null) {
      // Ensure contextData includes projectId if not passed directly to formatters that need it
      // For now, assuming formatters don't need projectId, or contextData is structured to include it.
      switch (toolName) {
        // These toolNames are examples and should match defined tools
        case 'manuscript_chat':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatManuscriptForAI((contextData as { chapters: Chapter[] }).chapters);
          break;
        case 'outline_chat':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatOutlineForAI(contextData as { chapters: Chapter[]; characters: Character[]; sceneTags: SceneTag[] });
          break;
        case 'character_chat':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatCharacterForAI(
            (contextData as { character: Character }).character,
            (contextData as { relatedScenes: Scene[] }).relatedScenes
          );
          break;
        case 'world_building_chat':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatWorldBuildingForAI((contextData as { notes: WorldBuildingNote[] }).notes);
          break;
        case 'scene_analyzer': // For tools that analyze a single scene
        case 'scene_helper':   // Matches existing AISidePanel toolName
        case 'scene_outliner': // Add this line
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatSceneForAI((contextData as { scene: Scene }).scene);
          break;
        // Add cases for 'plot_hole_checker', 'scene_character_suggester', 'character_backstory_generator', 'outline_json_generator' etc.
        case 'outline_json_generator':
          // For outline generation, we don't need formatted context - the synopsis is passed as userPrompt
          formattedContext = "";
          break;
        case 'plot_hole_checker_outline':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatOutlineForAI(contextData as { chapters: Chapter[]; characters: Character[]; sceneTags: SceneTag[] });
          break;
        case 'plot_hole_checker_manuscript':
          formattedContext = (await import('@/lib/ai/contextFormatters')).formatManuscriptForAI((contextData as { chapters: Chapter[] }).chapters);
          break;
        // Example for a non-context tool:
        case 'writing_coach': 
          // No specific project context needed for a general writing coach
          formattedContext = ""; 
          break;
        default:
          console.warn(`[AISMessageHandler] No specific context formatter for toolName '${toolName}'. Context data might not be used as intended.`);
      }
    }

    // 3. Prepare Final User Prompt
    // The userPrompt is the direct input from the user for this turn.
    // The formattedContext provides the background information.
    const fullPromptForAI = formattedContext
      ? `${formattedContext}\n\n---\n\nUser's Request:\n${userPrompt}`
      : userPrompt;

    // 4. Interact with snowganderChatService (lib/data/chat.ts)
    const aiResponse = await snowganderChatService(
      aiModelId,
      conversationHistory,
      fullPromptForAI, // This is the combined context + user query for this turn
      finalSystemPrompt
    );
    
    // 5. Update Credit Usage (non-blocking)
    try {
      // Use the actual cost from the AI response multiplied by 100 (1 snowgander credit = 100 app credits)
      const creditsToCharge = aiResponse.usage?.totalCost !== undefined 
        ? aiResponse.usage.totalCost * 100 
        : 1;
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        incrementUserCredits(user.id, creditsToCharge).catch(err => {
          console.error("[AISMessageHandler] Error updating credits:", err);
        });
      }
    } catch (authError) {
      console.error("[AISMessageHandler] Could not get user for credit update:", authError);
    }

    // 6. Log AI Interaction
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user && projectId) {
        const interactionToLog = {
          project_id: projectId,
          user_id: user.id,
          feature_used: toolName,
          ai_model_used: aiModelDetails.name, // Or aiModelDetails.api_name
          input_context: { raw_passed_context_data: contextData, formatted_context_string_for_ai: formattedContext },
          prompt_text: userPrompt, // Log the user's direct prompt for this turn
          response_data: aiResponse as unknown as Record<string, unknown>, // Cast to Record for Supabase JSONB type
        };
        
        const { error: logError } = await supabase
          .from('ai_interactions')
          .insert([interactionToLog]);

        if (logError) {
          console.error("[AISMessageHandler] Failed to log AI interaction:", logError.message);
        }
      } else {
        console.warn("[AISMessageHandler] Skipping AI interaction log: User or ProjectID not available.");
      }
    } catch (dbError) {
      console.error("[AISMessageHandler] Database error during AI interaction logging:", dbError);
    }

    return aiResponse;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred in AISMessageHandler.";
    console.error(`[AISMessageHandler] Critical error for tool '${toolName}':`, errorMessage);
    return {
      role: 'assistant',
      content: [{ type: 'error', publicMessage: `An internal error occurred while processing your request for tool '${toolName}'. Please try again.`, privateMessage: errorMessage }]
    };
  }
}
