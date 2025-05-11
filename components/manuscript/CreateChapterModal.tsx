"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { Chapter } from "@/lib/types";
import { createChapterSchema } from "@/lib/schemas/chapter.schema"; // Corrected import name

interface CreateChapterModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onChapterCreated: (newChapter: Chapter) => void;
}

export function CreateChapterModal({
  projectId,
  isOpen,
  onClose,
  onChapterCreated,
}: CreateChapterModalProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validationResult = createChapterSchema.safeParse({
      // Corrected schema name usage
      title,
      project_id: projectId,
    });
    if (!validationResult.success) {
      // Assuming chapterCreateSchema has title and project_id
      // And potentially 'order' if we decide to send it from client
      const firstError =
        validationResult.error.errors[0]?.message || "Invalid input.";
      setError(firstError);
      toast.error(firstError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validationResult.data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.error ||
          `Failed to create chapter (status: ${response.status})`;
        throw new Error(errorMessage);
      }

      const newChapter: Chapter = await response.json();
      toast.success("Chapter created successfully!");
      onChapterCreated(newChapter);
      setTitle(""); // Reset form
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      console.error("Failed to create chapter:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Chapter"
      // description="Enter a title for your new chapter." // Removed, Modal does not have this prop
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a title for your new chapter.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="chapterTitle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Chapter Title
            </label>
            <Input
              id="chapterTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., The Beginning"
              required
              className="w-full"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end space-x-3 pt-2">
            {" "}
            {/* Added pt-2 for spacing from error message */}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Chapter"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
