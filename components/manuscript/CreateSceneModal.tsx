"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { Scene } from "@/lib/types";
import { createSceneSchema } from "@/lib/schemas/scene.schema";
import { createScene } from "@/lib/data/scenes";

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
  const [primaryCategory, setPrimaryCategory] = useState<"" | string>("");
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
      primary_category: primaryCategory || undefined,
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
      const { ...sceneData } = validationResult.data;
      const newScene = await createScene(projectId, chapterId, sceneData);
      toast.success("Scene created successfully!");
      onSceneCreated(newScene);
      setTitle(""); // Reset form
      setPrimaryCategory(""); // Reset primary category
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
          <div>
            <label
              htmlFor="primaryCategory"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Primary Category <span className="text-red-500">*</span>
            </label>
            <select
              id="primaryCategory"
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              disabled={isLoading}
            >
              <option value="" disabled>
                Select a primary category
              </option>
              {[
                "Action",
                "Dialogue",
                "Reflection",
                "Discovery",
                "Relationship",
                "Transition",
                "Worldbuilding",
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
