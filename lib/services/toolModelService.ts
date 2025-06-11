// lib/services/toolModelService.ts
import 'server-only';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../supabase/server';
import { isSiteAdmin } from '../supabase/guards';
import { type ToolModelWithAIModel, type UpdateToolModelValues } from '../schemas/toolModel.schema';
import type { Database } from '../supabase/database.types';

async function ensureAdmin(supabase: SupabaseClient<Database>) {
    if (!(await isSiteAdmin(supabase))) {
        throw new Error('Forbidden: You do not have permission to perform this action.');
    }
}

export async function getToolModelsWithAIModel(): Promise<ToolModelWithAIModel[]> {
    const supabase = await createClient();
    await ensureAdmin(supabase);
    const { data, error } = await supabase.from("tool_model").select(`
        *,
        ai_models (
            *,
            ai_vendors ( name )
        )
    `).order("name");

    if (error) throw new Error('Failed to fetch tool models.');
    return data || [];
}

export async function getToolModelByName(name: string): Promise<ToolModelWithAIModel | null> {
    // This is a public-facing function for the AI handler, so no admin check here.
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
