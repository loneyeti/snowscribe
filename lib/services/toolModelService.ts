// lib/services/toolModelService.ts
import 'server-only';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../supabase/server';
import { isSiteAdmin } from '../supabase/guards';
import { type ToolModelWithAIModel, type UpdateToolModelValues, type CreateToolModelValues } from '../schemas/toolModel.schema';
import type { Database } from '../supabase/database.types';

async function ensureAdmin(supabase: SupabaseClient<Database>) {
    if (!(await isSiteAdmin(supabase))) {
        throw new Error('Forbidden: You do not have permission to perform this action.');
    }
}

export async function getToolModelsWithAIModel(name?: string): Promise<ToolModelWithAIModel[]> {
    const supabase = await createClient();
    await ensureAdmin(supabase);
    
    let query = supabase.from("tool_model").select(`
        *,
        ai_models (
            *,
            ai_vendors ( name )
        )
    `).order("name", { ascending: true });

    if (name) {
        query = query.eq('name', name);
    }

    const { data, error } = await query;

    if (error) throw new Error('Failed to fetch tool models.');
    return data || [];
}

export async function getToolModelByName(name: string): Promise<ToolModelWithAIModel | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tool_model").select(`
        *,
        ai_models (
            *,
            ai_vendors ( name )
        )
    `).eq('name', name).maybeSingle();

    if (error) throw new Error(`Failed to fetch tool model by name: ${name}`);
    return data;
}

export async function createToolModel(data: CreateToolModelValues): Promise<ToolModelWithAIModel> {
    const supabase = await createClient();
    await ensureAdmin(supabase);

    // Verify the referenced model exists
    const { error: modelError } = await supabase
        .from('ai_models')
        .select('id')
        .eq('id', data.model_id)
        .single();

    if (modelError) {
        throw new Error('Invalid model_id. Model does not exist.');
    }

    const { data: newToolModel, error } = await supabase
        .from('tool_model')
        .insert([data])
        .select(`
            *,
            ai_models (
                *,
                ai_vendors ( name )
            )
        `)
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('A tool model with this name already exists.');
        }
        throw new Error('Failed to create tool model');
    }

    return newToolModel;
}

export async function updateToolModel(toolModelId: string, data: UpdateToolModelValues): Promise<ToolModelWithAIModel> {
    const supabase = await createClient();
    await ensureAdmin(supabase);
    
    const { data: updatedToolModel, error } = await supabase
        .from("tool_model")
        .update({ model_id: data.model_id, updated_at: new Date().toISOString() })
        .eq("id", toolModelId)
        .select(`
            *,
            ai_models (
                *,
                ai_vendors ( name )
            )
        `)
        .single();
        
    if (error) {
        if (error.code === '23503') throw new Error("Invalid AI Model ID provided.");
        throw new Error("Failed to update tool model.");
    }
    
    return updatedToolModel;
}
