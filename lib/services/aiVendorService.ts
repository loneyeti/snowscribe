import 'server-only';
import { createClient } from '../supabase/server';
import { getAuthenticatedUser } from '../auth';
import type { AIVendor } from '../types';
import type { AIVendorFormData } from '../schemas/aiVendor.schema';

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

export async function getAIVendors(): Promise<AIVendor[]> {
    // await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.from('ai_vendors').select('*').order('name');
    if (error) throw new Error('Failed to fetch AI vendors.');
    return data || [];
}

export async function getAIVendorById(vendorId: string): Promise<AIVendor | null> {
    // await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.from('ai_vendors').select('*').eq('id', vendorId).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error('Failed to fetch AI vendor.');
    }
    return data;
}

export async function createAIVendor(vendorData: AIVendorFormData): Promise<AIVendor> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.from('ai_vendors').insert(vendorData).select().single();
    if (error) {
        if (error.code === '23505') throw new Error('AI vendor with this name already exists.');
        throw new Error('Failed to create AI vendor.');
    }
    return data;
}

export async function updateAIVendor(vendorId: string, vendorData: Partial<AIVendorFormData>): Promise<AIVendor> {
    await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase.from('ai_vendors').update(vendorData).eq('id', vendorId).select().single();
    if (error) {
        if (error.code === '23505') throw new Error('AI vendor with this name already exists.');
        throw new Error('Failed to update AI vendor.');
    }
    return data;
}

export async function deleteAIVendor(vendorId: string): Promise<void> {
    await ensureAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from('ai_vendors').delete().eq('id', vendorId);
    if (error) {
        if (error.code === '23503') throw new Error('Cannot delete vendor, it is referenced by other entities.');
        throw new Error('Failed to delete AI vendor.');
    }
}
