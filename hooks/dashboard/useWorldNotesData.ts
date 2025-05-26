// hooks/dashboard/useWorldNotesData.ts
import { useState, useCallback } from 'react';
import type { WorldBuildingNote } from '@/lib/types';
import type { WorldBuildingNoteFormValues } from '@/lib/schemas/worldBuildingNote.schema';
import {
  getWorldBuildingNotes,
  getWorldBuildingNote,
  updateWorldBuildingNote,
  deleteWorldBuildingNote as deleteWorldBuildingNoteData,
} from '@/lib/data/worldBuildingNotes';
import { toast } from 'sonner';

export function useWorldNotesData(projectId: string) {
  const [worldNotes, setWorldNotes] = useState<WorldBuildingNote[]>([]);
  const [isLoadingWorldNotesData, setIsLoadingWorldNotesData] = useState(false);
  const [selectedWorldNote, setSelectedWorldNote] = useState<WorldBuildingNote | null>(null);

  const fetchProjectWorldNotes = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingWorldNotesData(true);
    setSelectedWorldNote(null);
    try {
      const fetchedNotes = await getWorldBuildingNotes(projectId);
      setWorldNotes(fetchedNotes);
    } catch (error) {
      console.error("useWorldNotesData: Failed to fetch world notes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load world notes.");
    } finally {
      setIsLoadingWorldNotesData(false);
    }
  }, [projectId]);

  const handleWorldNoteSelect = useCallback(async (noteId: string) => {
    if (selectedWorldNote && selectedWorldNote.id === noteId) return;

    const existingNote = worldNotes.find((n) => n.id === noteId);
    if (existingNote && existingNote.content !== undefined) {
      setSelectedWorldNote(existingNote);
      return;
    }
    setIsLoadingWorldNotesData(true);
    try {
      const noteDetails = await getWorldBuildingNote(projectId, noteId);
      setSelectedWorldNote(noteDetails);
    } catch (error) {
      toast.error("Failed to load world note details.");
      console.error("useWorldNotesData: Error fetching world note details:", error);
    } finally {
      setIsLoadingWorldNotesData(false);
    }
  }, [projectId, worldNotes, selectedWorldNote]);

  const handleWorldNoteCreated = useCallback((newNote: WorldBuildingNote) => {
    setWorldNotes((prev) => [...prev, newNote].sort((a, b) => a.title.localeCompare(b.title)));
    setSelectedWorldNote(newNote);
  }, []);

  const handleSaveWorldNoteEditorData = useCallback(async (editorData: WorldBuildingNoteFormValues) => {
    if (!selectedWorldNote) {
      toast.error("No world note selected to save.");
      return null;
    }
    try {
      const updatedNoteFromApi = await updateWorldBuildingNote(
        projectId,
        selectedWorldNote.id,
        editorData
      );
      setWorldNotes((prev) =>
        prev
          .map((n) => (n.id === updatedNoteFromApi.id ? updatedNoteFromApi : n))
          .sort((a, b) => a.title.localeCompare(b.title))
      );
      if (selectedWorldNote?.id === updatedNoteFromApi.id) {
        setSelectedWorldNote(updatedNoteFromApi);
      }
      toast.success(`Note "${updatedNoteFromApi.title}" updated.`);
      return updatedNoteFromApi;
    } catch (error) {
      console.error("useWorldNotesData: Failed to save world note:", error);
      toast.error(error instanceof Error ? error.message : "Could not save world note details.");
      return null;
    }
  }, [projectId, selectedWorldNote]);

  const handleWorldNoteDeleted = useCallback(async (noteId: string) => {
    const noteToDelete = worldNotes.find(n => n.id === noteId);
    if (!noteToDelete) {
        toast.error("Note not found for deletion.");
        return false;
    }
    const noteNameToDelete = noteToDelete.title;
    try {
      await deleteWorldBuildingNoteData(projectId, noteId);
      setWorldNotes((prev) => prev.filter((n) => n.id !== noteId));
      if (selectedWorldNote?.id === noteId) {
        setSelectedWorldNote(null);
      }
      toast.success(`Note "${noteNameToDelete}" deleted.`);
      return true;
    } catch (error) {
      console.error("useWorldNotesData: Failed to delete world note:", error);
      toast.error(error instanceof Error ? error.message : "Could not delete world note.");
      return false;
    }
  }, [projectId, worldNotes, selectedWorldNote]);

  return {
    worldNotes,
    selectedWorldNote,
    isLoadingWorldNotesData,
    fetchProjectWorldNotes,
    handleWorldNoteSelect,
    handleWorldNoteCreated,
    handleSaveWorldNoteEditorData,
    handleWorldNoteDeleted,
    setSelectedWorldNote, // Expose for clearing selection
  };
}
