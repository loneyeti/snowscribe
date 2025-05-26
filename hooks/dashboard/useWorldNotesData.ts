// hooks/dashboard/useWorldNotesData.ts
import { useState, useCallback, useEffect } from 'react';
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
  const [worldNotesFetchAttempted, setWorldNotesFetchAttempted] = useState(false); // New state

  // New state for edit mode
  const [isEditingSelectedNote, setIsEditingSelectedNote] = useState(false);

  // Reset fetchAttempted if projectId changes.
  useEffect(() => {
    // This effect runs when the hook is first called with a projectId,
    // and any time the projectId changes.
    setWorldNotesFetchAttempted(false);
    setWorldNotes([]); // Clear existing notes when project changes
    setSelectedWorldNote(null); // Clear selection
    setIsEditingSelectedNote(false); // Reset edit mode on project change
    // Note: We don't fetch here. The component (WorldNotesSection) will decide when to fetch
    // based on its `isActive` state and this `worldNotesFetchAttempted` flag.
  }, [projectId]);

  const fetchProjectWorldNotes = useCallback(async () => {
    if (!projectId) {
      setWorldNotesFetchAttempted(true); // Mark as attempted to prevent loops if projectId is temporarily missing
      return;
    }
    setIsLoadingWorldNotesData(true);
    // setSelectedWorldNote(null); // Already handled by useEffect on projectId change and component logic
    try {
      const fetchedNotes = await getWorldBuildingNotes(projectId);
      setWorldNotes(fetchedNotes);
    } catch (error) {
      console.error("useWorldNotesData: Failed to fetch world notes:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load world notes.");
    } finally {
      setIsLoadingWorldNotesData(false);
      setWorldNotesFetchAttempted(true); // Set attempted flag here
    }
  }, [projectId]); // fetchProjectWorldNotes depends only on projectId

  const handleWorldNoteSelect = useCallback(async (noteId: string) => {
    if (selectedWorldNote && selectedWorldNote.id === noteId) {
      // If re-selecting the same note, reset edit mode to false (view mode)
      setIsEditingSelectedNote(false);
      return;
    }

    const existingNote = worldNotes.find((n) => n.id === noteId);
    // Assuming full data (like content) is fetched by getWorldBuildingNotes
    if (existingNote) {
      setSelectedWorldNote(existingNote);
      setIsEditingSelectedNote(false); // Reset edit mode on new selection
      return;
    }
    // If not found in local list (shouldn't happen if list is comprehensive), fetch details
    setIsLoadingWorldNotesData(true);
    try {
      const noteDetails = await getWorldBuildingNote(projectId, noteId);
      setSelectedWorldNote(noteDetails);
      setIsEditingSelectedNote(false); // Reset edit mode on new selection
      // Optionally update the main list if the fetched detail is more complete
      if (noteDetails) {
        setWorldNotes(prev => prev.map(n => n.id === noteId ? noteDetails : n));
      }
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
    setIsEditingSelectedNote(false); // Reset edit mode on new note creation
    // Creating a note means we have attempted interaction and likely have data.
    setWorldNotesFetchAttempted(true);
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
        setIsEditingSelectedNote(false); // Reset edit mode on deletion of selected note
      }
      toast.success(`Note "${noteNameToDelete}" deleted.`);
      return true;
    } catch (error) {
      console.error("useWorldNotesData: Failed to delete world note:", error);
      toast.error(error instanceof Error ? error.message : "Could not delete world note.");
      return false;
    }
  }, [projectId, worldNotes, selectedWorldNote]);

  // New handlers for toggling edit mode
  const enableEditMode = useCallback(() => {
    setIsEditingSelectedNote(true);
  }, []);

  const disableEditMode = useCallback(() => {
    setIsEditingSelectedNote(false);
  }, []);

  return {
    worldNotes,
    selectedWorldNote,
    isLoadingWorldNotesData,
    worldNotesFetchAttempted, // Expose the flag
    fetchProjectWorldNotes,
    handleWorldNoteSelect,
    handleWorldNoteCreated,
    handleSaveWorldNoteEditorData,
    handleWorldNoteDeleted,
    setSelectedWorldNote,
    isEditingSelectedNote,
    enableEditMode,
    disableEditMode,
  };
}
