"use client";

import React, { useState, useEffect } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import type { CreateProjectValues } from "@/lib/schemas/project.schema";
import { createProjectSchema } from "@/lib/schemas/project.schema"; // For client-side validation (optional but good practice)
import type { Project, Genre } from "@/lib/types"; // Import Project and Genre types

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (newProject: Project) => void; // Use Project type here
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genreId, setGenreId] = useState<string>(""); // Store genre ID as string from select
  const [logLine, setLogLine] = useState("");
  const [targetWordCount, setTargetWordCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isFetchingGenres, setIsFetchingGenres] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchGenres = async () => {
        setIsFetchingGenres(true);
        try {
          const response = await fetch("/api/genres");
          if (!response.ok) {
            throw new Error("Failed to fetch genres");
          }
          const data = await response.json();
          setGenres(data);
        } catch (error) {
          console.error("Error fetching genres:", error);
          toast.error("Could not load genres. Please try again.");
          // Optionally, you could set an error state here to display in the UI
        } finally {
          setIsFetchingGenres(false);
        }
      };
      fetchGenres();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setGenreId(""); // Reset genreId
    setLogLine("");
    setTargetWordCount("");
    setErrors({});
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData: Omit<CreateProjectValues, "genre_id"> & {
      genre_id?: number;
    } = {
      title,
      log_line: logLine || undefined,
      target_word_count: targetWordCount
        ? parseInt(targetWordCount, 10)
        : undefined,
    };

    // Validate and add genre_id
    const parsedGenreId = parseInt(genreId, 10);
    if (!isNaN(parsedGenreId) && parsedGenreId > 0) {
      formData.genre_id = parsedGenreId;
    } else {
      // Handle case where genreId is not a valid number or not selected
      // This will be caught by Zod validation if genre_id is required
      // and not provided or invalid.
    }

    const validationResult = createProjectSchema.safeParse(
      formData as CreateProjectValues
    );

    if (!validationResult.success) {
      const formattedErrors: Record<string, string[]> = {};
      for (const issue of validationResult.error.issues) {
        formattedErrors[issue.path[0]] = [
          ...(formattedErrors[issue.path[0]] || []),
          issue.message,
        ];
      }
      setErrors(formattedErrors);
      setIsLoading(false);
      toast.error("Please correct the errors in the form.");
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Failed to create project (status ${response.status})`
        );
      }

      toast.success("Novel project created successfully!");
      if (onProjectCreated) {
        onProjectCreated(result);
      }
      handleClose();
      router.refresh(); // Refresh server components on the page
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Novel Project"
      size="lg"
      footerContent={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Cosmic Labyrinth"
            className={errors.title ? "border-destructive" : ""}
            disabled={isLoading || isFetchingGenres}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">
              {errors.title.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="genre"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Genre <span className="text-destructive">*</span>
          </label>
          <select
            id="genre_id"
            name="genre_id"
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
            className={`block w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.genre_id ? "border-destructive" : "border-input"
            }`}
            disabled={isLoading || isFetchingGenres}
          >
            <option value="">
              {isFetchingGenres ? "Loading genres..." : "Select a genre"}
            </option>
            {genres.map((g) => (
              <option key={g.id} value={g.id.toString()}>
                {" "}
                {/* Use g.id for value */}
                {g.name}
              </option>
            ))}
          </select>
          {errors.genre_id && (
            <p className="mt-1 text-xs text-destructive">
              {errors.genre_id.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="log_line"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Log Line (Optional)
          </label>
          <Textarea
            id="log_line"
            name="log_line"
            value={logLine}
            onChange={(e) => setLogLine(e.target.value)}
            placeholder="A brief summary or logline for your novel."
            rows={3}
            className={errors.log_line ? "border-destructive" : ""}
            disabled={isLoading || isFetchingGenres}
          />
          {errors.log_line && (
            <p className="mt-1 text-xs text-destructive">
              {errors.log_line.join(", ")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="targetWordCount"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Target Word Count (Optional)
          </label>
          <Input
            id="targetWordCount"
            name="targetWordCount"
            type="number"
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(e.target.value)}
            placeholder="e.g., 80000"
            min="0"
            className={errors.target_word_count ? "border-destructive" : ""}
            disabled={isLoading || isFetchingGenres}
          />
          {errors.target_word_count && (
            <p className="mt-1 text-xs text-destructive">
              {errors.target_word_count.join(", ")}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
