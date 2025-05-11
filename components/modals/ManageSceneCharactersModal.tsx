"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Character } from "@/lib/types";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "sonner"; // Import toast

interface ManageSceneCharactersModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProjectCharacters: Character[];
  currentSceneCharacterIds: string[];
  onSave: (sceneId: string, selectedCharacterIds: string[]) => void; // Updated to include sceneId
  sceneTitle?: string;
  projectId: string; // Added projectId
  sceneId: string; // Added sceneId
}

export function ManageSceneCharactersModal({
  isOpen,
  onClose,
  allProjectCharacters,
  currentSceneCharacterIds,
  onSave,
  sceneTitle,
  projectId, // Added
  sceneId, // Added
}: ManageSceneCharactersModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentSceneCharacterIds)
  );
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  useEffect(() => {
    // Reset selected IDs when modal opens with new currentSceneCharacterIds
    if (isOpen) {
      setSelectedIds(new Set(currentSceneCharacterIds));
    }
  }, [isOpen, currentSceneCharacterIds]);

  const handleToggleCharacter = (characterId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(characterId)) {
        newSet.delete(characterId);
      } else {
        newSet.add(characterId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    // Make handleSave async
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/scenes/${sceneId}/characters`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ characterIds: Array.from(selectedIds) }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update scene characters");
      }

      toast.success("Scene characters updated successfully!");
      onSave(sceneId, Array.from(selectedIds)); // Pass sceneId back
      onClose();
    } catch (error) {
      console.error("Error updating scene characters:", error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = sceneTitle
    ? `Manage Characters for "${sceneTitle}"`
    : "Manage Scene Characters";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
      footerContent={
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Characters"}
          </Button>
        </div>
      }
    >
      {allProjectCharacters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No characters available in this project. Please add characters in the
          Characters section first.
        </p>
      ) : (
        // Assuming ScrollArea and Checkbox components exist and work as expected.
        // If not, these would need to be standard HTML elements or implemented.
        <ScrollArea className="h-72">
          {" "}
          {/* Adjust height as needed */}
          <div className="space-y-2 pr-4">
            {allProjectCharacters.map((character) => (
              <div
                key={character.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
              >
                <Checkbox
                  id={`char-${character.id}`}
                  checked={selectedIds.has(character.id)}
                  onCheckedChange={() => handleToggleCharacter(character.id)}
                />
                <label
                  htmlFor={`char-${character.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer"
                >
                  {character.name}
                  {character.nickname && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({character.nickname})
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Modal>
  );
}
