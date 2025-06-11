// hooks/dashboard/useSceneDragDrop.ts
import React, { useState, useCallback } from "react";
import type { Scene } from "../../lib/types";
import { toast } from "sonner";
import { reorderScenesInChapter } from "../../lib/data/scenes";

export function useSceneDragDrop(
  projectId: string,
  selectedChapterId: string | null,
  scenesForSelectedChapter: Scene[],
  // Callback to update local state in useManuscriptData
  updateLocalSceneOrderCallback: (reorderedScenes: Scene[]) => void
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

          // Prepare data for the server action
          const scenesWithNewOrder = reorderedScenes.map((scene, index) => ({
            id: scene.id,
            order: index,
          }));

          const toastId = toast.loading("Saving new scene order...");
          try {
            // Call the new server action instead of the callback
            await reorderScenesInChapter(projectId, selectedChapterId, scenesWithNewOrder);
            toast.success("Scene order saved!", { id: toastId });
          } catch (error) {
            toast.error("Failed to save scene order. Reverting.", { id: toastId });
            console.error("Error persisting scene order:", error);
            // On failure, revert the optimistic UI update by re-setting the original order
            updateLocalSceneOrderCallback(scenesForSelectedChapter);
          }
        }
      }
    },
    [
      selectedChapterId,
      scenesForSelectedChapter,
      updateLocalSceneOrderCallback,
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
