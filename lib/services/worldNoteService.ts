import 'server-only';
import { createClient } from '../supabase/server';
import { verifyProjectOwnership } from '../supabase/guards';
import type { WorldBuildingNote } from '../types';
import { worldBuildingNoteBaseSchema, createWorldBuildingNoteSchema, type WorldBuildingNoteFormValues } from '../schemas/worldBuildingNote.schema';

export async function getWorldBuildingNotes(projectId: string, userId: string): Promise<WorldBuildingNote[]> {
    const supabase = await createClient();
    const ownership = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const { data, error } = await supabase
        .from('world_building_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('title', { ascending: true });
    
    if (error) throw new Error('Failed to fetch world building notes.');
    return data || [];
}

export async function getWorldBuildingNote(projectId: string, noteId: string, userId: string): Promise<WorldBuildingNote> {
    const supabase = await createClient();
    const ownership = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const { data: note, error } = await supabase
        .from('world_building_notes')
        .select('*')
        .eq('id', noteId)
        .eq('project_id', projectId)
        .single();

    if (error) throw new Error('Failed to fetch world building note.');
    return note;
}

export async function createWorldBuildingNote(projectId: string, userId: string, noteData: WorldBuildingNoteFormValues): Promise<WorldBuildingNote> {
    const supabase = await createClient();
    const ownership = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const validatedData = createWorldBuildingNoteSchema.parse({ ...noteData, project_id: projectId });

    const { data: newNote, error } = await supabase
        .from('world_building_notes')
        .insert(validatedData)
        .select()
        .single();
        
    if (error) throw new Error('Failed to create world building note.');
    return newNote;
}

export async function updateWorldBuildingNote(projectId: string, noteId: string, userId: string, noteData: Partial<WorldBuildingNoteFormValues>): Promise<WorldBuildingNote> {
    const supabase = await createClient();
    const ownership = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const validatedData = worldBuildingNoteBaseSchema.partial().parse(noteData);

    const { data: updatedNote, error } = await supabase
        .from('world_building_notes')
        .update({ ...validatedData, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .eq('project_id', projectId)
        .select()
        .single();

    if (error) throw new Error('Failed to update world building note.');
    return updatedNote;
}

export async function deleteWorldBuildingNote(projectId: string, noteId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const ownership = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownership.error) throw new Error(ownership.error.message);

    const { error } = await supabase
        .from('world_building_notes')
        .delete()
        .eq('id', noteId)
        .eq('project_id', projectId);

    if (error) throw new Error('Failed to delete world building note.');
}
