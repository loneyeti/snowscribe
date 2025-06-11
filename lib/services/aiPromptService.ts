import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import { aiPromptSchema, type AIPromptFormData } from '../schemas/aiPrompt.schema';
import type { AIPrompt } from '../types';
import type { Database } from '../supabase/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getPromptWithOwnershipCheck(supabase: SupabaseClient<Database>, promptId: string, userId: string) {
    const { data: prompt, error } = await supabase
        .from("ai_prompts")
        .select('*, projects(user_id)')
        .eq("id", promptId)
        .maybeSingle();

    if (error) throw new Error("Failed to fetch AI prompt for ownership check.");
    if (!prompt) return { prompt: null, error: 'AI prompt not found.', status: 404 };

    if (prompt.project_id) {
        if (!prompt.projects || prompt.projects.user_id !== userId) {
            return { prompt: null, error: 'Forbidden: You do not own the project this prompt belongs to.', status: 403 };
        }
    } else if (prompt.user_id && prompt.user_id !== userId) {
        return { prompt: null, error: 'Forbidden: You do not own this prompt.', status: 403 };
    }
    
    // Remove the nested project user_id before returning
    if (prompt.projects) {
        const projects = prompt.projects as { user_id?: string };
        delete projects.user_id;
    }

    return { prompt, error: null, status: 200 };
}

export async function getAIPrompts(userId: string, filter?: { projectId?: string; scope?: 'global' | 'user' | 'project'; category?: string }): Promise<AIPrompt[]> {
    const supabase = await createClient();
    let query = supabase.from("ai_prompts").select('*');

    if (filter?.category) {
        query = query.eq("category", filter.category);
        if (filter.scope === 'global' || !filter.scope) {
            query = query.is("user_id", null).is("project_id", null);
        } else if (filter.scope === 'user') {
            query = query.eq("user_id", userId).is("project_id", null);
        }
    } else if (filter?.projectId) {
        const ownership = await verifyProjectOwnership(supabase, filter.projectId, userId);
        if (ownership.error) throw new Error(ownership.error.message);
        query = query.eq("project_id", filter.projectId);
    } else if (filter?.scope === 'user') {
        query = query.eq("user_id", userId).is("project_id", null);
    } else if (filter?.scope === 'global') {
        query = query.is("user_id", null).is("project_id", null);
    } else {
        query = query.or(`user_id.eq.${userId},and(user_id.is.null,project_id.is.null)`);
    }

    const { data, error } = await query.order("name", { ascending: true });
    if (error) throw new Error("Failed to fetch AI prompts.");
    return data || [];
}

export async function getAIPromptById(promptId: string, userId: string): Promise<AIPrompt | null> {
    const supabase = await createClient();
    const { prompt, error, status } = await getPromptWithOwnershipCheck(supabase, promptId, userId);
    if (error) {
         if (status === 404) return null;
         throw new Error(error);
    }
    return prompt;
}

export async function createAIPrompt(userId: string, promptData: AIPromptFormData): Promise<AIPrompt> {
    const supabase = await createClient();
    const validatedData = aiPromptSchema.parse(promptData);

    if (validatedData.project_id) {
        const ownership = await verifyProjectOwnership(supabase, validatedData.project_id, userId);
        if (ownership.error) throw new Error(ownership.error.message);
        validatedData.user_id = null;
    } else {
        validatedData.user_id = userId;
    }
    
    const { data: newPrompt, error } = await supabase.from('ai_prompts').insert(validatedData).select().single();
    if (error) {
        if (error.code === '23505') throw new Error('An AI prompt with this name already exists for the given scope.');
        throw new Error('Failed to create AI prompt.');
    }
    return newPrompt;
}

export async function updateAIPrompt(promptId: string, userId: string, promptData: Partial<AIPromptFormData>): Promise<AIPrompt> {
    const supabase = await createClient();
    const { error: checkError } = await getPromptWithOwnershipCheck(supabase, promptId, userId);
    if (checkError) throw new Error(checkError);

    const validatedData = aiPromptSchema.partial().parse(promptData);
    
    const { data: updatedPrompt, error } = await supabase.from('ai_prompts').update(validatedData).eq('id', promptId).select().single();
    if (error) {
        if (error.code === '23505') throw new Error('An AI prompt with this name already exists for the given scope.');
        throw new Error('Failed to update AI prompt.');
    }
    return updatedPrompt;
}

export async function deleteAIPrompt(promptId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error: checkError } = await getPromptWithOwnershipCheck(supabase, promptId, userId);
    if (checkError) throw new Error(checkError);
    
    const { error } = await supabase.from('ai_prompts').delete().eq('id', promptId);
    if (error) throw new Error('Failed to delete AI prompt.');
}
