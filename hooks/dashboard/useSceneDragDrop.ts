// hooks/dashboard/useSceneDragDrop.ts
import React, { useState, useCallback } from "react";
import type { Scene } from "../../lib/types";
import { toast } from "sonner";

export function useSceneDragDrop(
  projectId: string,
  selectedChapterId: string | null,
  scenesForSelectedChapter: Scene[],
  // Callback to update local state in useManuscriptData
  updateLocalSceneOrderCallback: (reorderedScenes: Scene[]) => void,
  // Callback to persist order to backend (from useManuscriptData or ManuscriptSection)
  persistSceneOrderCallback: (projectId: string, chapterId: string, reorderedScenes: Scene[]) => Promise<void>
) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sceneId: string) => {
      setDraggedSceneId(sceneId);
      event.dataTransfer.setData("text/plain", sceneId);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sceneId: string) => {
      event.preventDefault();
      if (sceneId !== draggedSceneId) {
        setDragOverSceneId(sceneId);
      }
    },
    [draggedSceneId]
  );

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverSceneId(null);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>, targetSceneId: string) => {
      event.preventDefault();
      const sourceSceneId = event.dataTransfer.getData("text/plain");
      setDraggedSceneId(null);
      setDragOverSceneId(null);

      if (!selectedChapterId) {
        toast.error("No chapter selected for scene reordering.");
        return;
      }

      if (sourceSceneId && sourceSceneId !== targetSceneId) {
        const sourceIndex = scenesForSelectedChapter.findIndex(
          (scene) => scene.id === sourceSceneId
        );
        const targetIndex = scenesForSelectedChapter.findIndex(
          (scene) => scene.id === targetSceneId
        );

        if (sourceIndex !== -1 && targetIndex !== -1) {
          const reorderedScenes = [...scenesForSelectedChapter];
          const [draggedItem] = reorderedScenes.splice(sourceIndex, 1);
          reorderedScenes.splice(targetIndex, 0, draggedItem);

          // Update local state optimistically
          updateLocalSceneOrderCallback(reorderedScenes);

          // Persist to backend
          try {
            await persistSceneOrderCallback(projectId, selectedChapterId, reorderedScenes);
          } catch (error) {
            // Revert optimistic update on error by re-fetching or restoring previous order
            toast.error("Failed to save scene order. Reverting.");
            // This might require fetching original scenes or having a rollback mechanism
            // For simplicity, the persistSceneOrderCallback itself might handle re-fetching on error
            // Or, the ManuscriptSection could trigger a re-fetch.
            console.error("Error persisting scene order:", error);
          }
        }
      }
    },
    [
      selectedChapterId,
      scenesForSelectedChapter,
      updateLocalSceneOrderCallback,
      persistSceneOrderCallback,
      projectId,
    ]
  );

  return {
    draggedSceneId,
    dragOverSceneId,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
