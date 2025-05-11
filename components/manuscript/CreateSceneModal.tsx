"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { Scene } from "@/lib/types";
import { createSceneSchema } from "@/lib/schemas/scene.schema";

interface CreateSceneModalProps {
  projectId: string;
  chapterId: string;
  isOpen: boolean;
  onClose: () => void;
  onSceneCreated: (newScene: Scene) => void;
}

export function CreateSceneModal({
  projectId,
  chapterId,
  isOpen,
  onClose,
  onSceneCreated,
}: CreateSceneModalProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Note: Scene schema might require 'order'. For now, assuming API handles it or it's optional.
    // If 'order' is required by createSceneSchema, it needs to be added here. (It's optional in base)
    const validationResult = createSceneSchema.safeParse({
      title: title, // Title is required by schema
      chapter_id: chapterId,
      project_id: projectId, // project_id is required by createSceneSchema
    });

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || "Invalid input.";
      setError(firstError);
      toast.error(firstError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/chapters/${chapterId}/scenes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validationResult.data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.error ||
          `Failed to create scene (status: ${response.status})`;
        throw new Error(errorMessage);
      }

      const newScene: Scene = await response.json();
      toast.success("Scene created successfully!");
      onSceneCreated(newScene);
      setTitle(""); // Reset form
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to create scene:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Scene">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a title for your new scene.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="sceneTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Scene Title
            </label>
            <Input
              id="sceneTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Discovery"
              required // Title is required by schema
              className="w-full"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Scene"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
