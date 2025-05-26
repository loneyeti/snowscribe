// hooks/dashboard/useCharactersData.ts
import { useState, useCallback } from 'react';
import type { Character } from '@/lib/types';
import type { CharacterFormData } from '@/components/editors/CharacterCardEditor';
import {
  getCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter as deleteCharacterData,
  // createCharacter is handled by CreateCharacterModal, hook needs to update list
} from '@/lib/data/characters';
import { toast } from 'sonner';

export function useCharactersData(projectId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharactersData, setIsLoadingCharactersData] = useState(false); // Start as false, fetch on demand
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const fetchProjectCharacters = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingCharactersData(true);
    setSelectedCharacter(null); // Clear selection when re-fetching list
    try {
      const fetchedCharacters = await getCharacters(projectId);
      setCharacters(fetchedCharacters);
    } catch (error) {
      console.error("useCharactersData: Failed to fetch characters:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load characters.");
    } finally {
      setIsLoadingCharactersData(false);
    }
  }, [projectId]);

  const handleCharacterSelect = useCallback(async (characterId: string) => {
    // If already selected, do nothing to avoid re-fetch unless necessary
    if (selectedCharacter && selectedCharacter.id === characterId) {
        // Potentially refresh if needed, but for now, assume data is current
        // const characterDetails = await getCharacter(projectId, characterId);
        // setSelectedCharacter(characterDetails);
        return;
    }

    const existingCharacter = characters.find((c) => c.id === characterId);
    // Check if full data is likely present (e.g., description is not just a placeholder)
    if (existingCharacter && typeof existingCharacter.description === 'string') {
      setSelectedCharacter(existingCharacter);
      return;
    }

    // Fetch full details if not found or seems partial
    setIsLoadingCharactersData(true); // Indicate loading for the detail view
    try {
      const characterDetails = await getCharacter(projectId, characterId);
      setSelectedCharacter(characterDetails);
    } catch (error) {
      toast.error("Failed to load character details.");
      console.error("useCharactersData: Error fetching character details:", error);
    } finally {
      setIsLoadingCharactersData(false); // Stop loading indicator for detail view
    }
  }, [projectId, characters, selectedCharacter]);

  const handleCharacterCreated = useCallback((newCharacter: Character) => {
    setCharacters((prev) =>
      [...prev, newCharacter].sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedCharacter(newCharacter);
  }, []);

  const handleSaveCharacterEditorData = useCallback(async (editorData: CharacterFormData) => {
    if (!selectedCharacter) {
      toast.error("No character selected to save.");
      return null;
    }
    const { id, ...updatePayload } = editorData; // Exclude id from payload
    try {
      const updatedCharacterFromApi = await updateCharacter(
        projectId,
        selectedCharacter.id,
        updatePayload
      );
      setCharacters((prev) =>
        prev
          .map((c) => (c.id === updatedCharacterFromApi.id ? updatedCharacterFromApi : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      if (selectedCharacter?.id === updatedCharacterFromApi.id) {
        setSelectedCharacter(updatedCharacterFromApi);
      }
      toast.success(`Character "${updatedCharacterFromApi.name}" updated.`);
      return updatedCharacterFromApi;
    } catch (error) {
      console.error("useCharactersData: Failed to save character:", error);
      toast.error(error instanceof Error ? error.message : "Could not save character details.");
      return null;
    }
  }, [projectId, selectedCharacter]);

  const handleCharacterDeleted = useCallback(async (characterId: string) => {
    // Ensure the character to be deleted is the currently selected one or logic is adjusted
    const characterToDelete = characters.find(c => c.id === characterId);
    if (!characterToDelete) {
        toast.error("Character not found for deletion.");
        return false;
    }
    const characterNameToDelete = characterToDelete.name;
    try {
      await deleteCharacterData(projectId, characterId);
      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
      toast.success(`Character "${characterNameToDelete}" deleted.`);
      return true;
    } catch (error) {
      console.error("useCharactersData: Failed to delete character:", error);
      toast.error(error instanceof Error ? error.message : "Could not delete character.");
      return false;
    }
  }, [projectId, characters, selectedCharacter]);

  return {
    characters,
    selectedCharacter,
    isLoadingCharactersData,
    fetchProjectCharacters,
    handleCharacterSelect,
    handleCharacterCreated,
    handleSaveCharacterEditorData,
    handleCharacterDeleted,
    setCharacters, // Expose to allow direct manipulation if needed (e.g. after creation if API returns partial data)
    setSelectedCharacter, // Expose for direct manipulation
  };
}
