"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { SceneTag } from "@/lib/types";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "sonner";
import { updateSceneTags } from "@/lib/data/scenes";

interface ManageSceneTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProjectSceneTags: SceneTag[];
  currentSceneTagIds: string[];
  onSave: (sceneId: string, selectedTagIds: string[]) => void;
  sceneTitle?: string;
  projectId: string;
  sceneId: string;
  isLoadingProjectTags?: boolean; // Added prop
}

export function ManageSceneTagsModal({
  isOpen,
  onClose,
  allProjectSceneTags,
  currentSceneTagIds,
  onSave,
  sceneTitle,
  projectId,
  sceneId,
  isLoadingProjectTags, // Destructure new prop
}: ManageSceneTagsModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(currentSceneTagIds)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(currentSceneTagIds));
    }
  }, [isOpen, currentSceneTagIds]);

  const handleToggleTag = (tagId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSceneTags(projectId, sceneId, Array.from(selectedIds));
      toast.success("Scene tags updated successfully!");
      onSave(sceneId, Array.from(selectedIds));
      onClose();
    } catch (error) {
      console.error("Error updating scene tags:", error);
      toast.error((error as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const modalTitle = sceneTitle
    ? `Manage Tags for "${sceneTitle}"`
    : "Manage Scene Tags";

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
            {isLoading ? "Saving..." : "Save Tags"}
          </Button>
        </div>
      }
    >
      {isLoadingProjectTags ? (
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      ) : allProjectSceneTags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags available for this project. You can create project-specific or
          global tags.
        </p>
      ) : (
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-4">
            {allProjectSceneTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50"
              >
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedIds.has(tag.id)}
                  onCheckedChange={() => handleToggleTag(tag.id)}
                />
                <label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-grow cursor-pointer"
                >
                  {tag.name}
                  {tag.color && (
                    <span
                      className="ml-2 inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                      title={`Color: ${tag.color}`}
                    />
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
