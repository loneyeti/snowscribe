import 'server-only';
import { createClient } from '../supabase/server';
import { getAuthenticatedUser } from '../auth';
import type { AIModel } from '../types';
import type { AIModelFormData } from '../schemas/aiModel.schema';

async function ensureAdmin() {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_site_admin')
        .eq('id', user.id)
        .single();
    
    if (!profile?.is_site_admin) {
        throw new Error('Forbidden: You do not have permission to perform this action.');
    }
}

export async function getAIModels(): Promise<AIModel[]> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('name');

    if (error) throw new Error('Failed to fetch AI models.');
    return data || [];
}

export async function getAIModelById(modelId: string): Promise<AIModel | null> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', modelId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error('Failed to fetch AI model.');
    }
    return data;
}

export async function createAIModel(modelData: AIModelFormData): Promise<AIModel> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_models')
        .insert(modelData)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('AI model with this name already exists.');
        throw new Error('Failed to create AI model.');
    }
    return data;
}

export async function updateAIModel(modelId: string, modelData: Partial<AIModelFormData>): Promise<AIModel> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('ai_models')
        .update(modelData)
        .eq('id', modelId)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') throw new Error('AI model with this name already exists.');
        throw new Error('Failed to update AI model.');
    }
    return data;
}

export async function deleteAIModel(modelId: string): Promise<void> {
    await ensureAdmin();
    const supabase = await createClient();
    const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', modelId);

    if (error) {
        if (error.code === '23503') throw new Error('Cannot delete model, it is referenced by other entities.');
        throw new Error('Failed to delete AI model.');
    }
}
