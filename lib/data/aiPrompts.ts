"use server";
import * as aiPromptService from '../services/aiPromptService';
import { getAuthenticatedUser } from '../auth';
import type { AIPrompt } from '../types';
import type { AIPromptFormData } from '../schemas/aiPrompt.schema';

export async function getAIPrompts(filter?: { projectId?: string; scope?: 'global' | 'user' | 'project' }): Promise<AIPrompt[]> {
    const user = await getAuthenticatedUser();
    return aiPromptService.getAIPrompts(user.id, filter);
}

export async function getAIPromptById(promptId: string): Promise<AIPrompt | null> {
    const user = await getAuthenticatedUser();
    return aiPromptService.getAIPromptById(promptId, user.id);
}

export async function createAIPrompt(promptData: AIPromptFormData): Promise<AIPrompt> {
    const user = await getAuthenticatedUser();
    return aiPromptService.createAIPrompt(user.id, promptData);
}

export async function updateAIPrompt(promptId: string, promptData: Partial<AIPromptFormData>): Promise<AIPrompt> {
    const user = await getAuthenticatedUser();
    return aiPromptService.updateAIPrompt(promptId, user.id, promptData);
}

export async function deleteAIPrompt(promptId: string): Promise<void> {
    const user = await getAuthenticatedUser();
    await aiPromptService.deleteAIPrompt(promptId, user.id);
}

export async function getSystemPromptByCategory(category: string): Promise<string | null> {
    try {
        const user = await getAuthenticatedUser();
        const prompts = await aiPromptService.getAIPrompts(user.id, { scope: 'global', category });
        return prompts.length > 0 ? prompts[0].prompt_text : null;
    } catch (error) {
        console.error(`Error fetching system prompt for category ${category}:`, error);
        return null;
    }
}
