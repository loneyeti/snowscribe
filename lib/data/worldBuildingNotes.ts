"use server";
import type { WorldBuildingNote } from '../types';
import { type WorldBuildingNoteFormValues } from '../schemas/worldBuildingNote.schema';
import * as worldNoteService from '../services/worldNoteService';
import { getAuthenticatedUser } from '../auth';

export async function getWorldBuildingNotes(projectId: string): Promise<WorldBuildingNote[]> {
    const user = await getAuthenticatedUser();
    return worldNoteService.getWorldBuildingNotes(projectId, user.id);
}

export async function createWorldBuildingNote(projectId: string, noteData: WorldBuildingNoteFormValues): Promise<WorldBuildingNote> {
    const user = await getAuthenticatedUser();
    return worldNoteService.createWorldBuildingNote(projectId, user.id, noteData);
}

export async function updateWorldBuildingNote(projectId: string, noteId: string, noteData: Partial<WorldBuildingNoteFormValues>): Promise<WorldBuildingNote> {
    const user = await getAuthenticatedUser();
    return worldNoteService.updateWorldBuildingNote(projectId, noteId, user.id, noteData);
}

export async function deleteWorldBuildingNote(projectId: string, noteId: string): Promise<void> {
    const user = await getAuthenticatedUser();
    await worldNoteService.deleteWorldBuildingNote(projectId, noteId, user.id);
}

export async function getWorldBuildingNote(projectId: string, noteId: string): Promise<WorldBuildingNote> {
    const user = await getAuthenticatedUser();
    return worldNoteService.getWorldBuildingNote(projectId, noteId, user.id);
}
