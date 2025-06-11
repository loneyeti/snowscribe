"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import {
  updateProjectSchema,
  type UpdateProjectValues,
} from "@/lib/schemas/project.schema";
import type { Project, Genre } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";
import { updateProject } from "@/lib/data/projects";
import { getGenres } from "@/lib/data/genres";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project & { genres?: Genre | null };
  onProjectUpdated: (updatedProject: Project) => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: EditProjectModalProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isFetchingGenres, setIsFetchingGenres] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProjectValues>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: project.title || "",
      genre_id: project.genre_id ?? undefined,
      log_line: project.log_line || "",
      target_word_count: project.target_word_count ?? undefined,
    },
  });

  const fetchGenres = async () => {
    setIsFetchingGenres(true);
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (error) {
      toast.error("Could not load genres.");
      console.error("Error fetching genres:", error);
    } finally {
      setIsFetchingGenres(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reset({
        title: project.title || "",
        genre_id: project.genre_id ?? undefined,
        log_line: project.log_line || "",
        target_word_count: project.target_word_count ?? undefined,
      });
      if (genres.length === 0) {
        // Fetch genres only if not already loaded
        fetchGenres();
      }
    }
  }, [project, isOpen, reset, genres.length]);

  const onSubmit = async (data: UpdateProjectValues) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      onClose();
      return;
    }

    const payload: UpdateProjectValues = {
      ...data,
      target_word_count: data.target_word_count
        ? Number(data.target_word_count)
        : null,
      genre_id: data.genre_id ? Number(data.genre_id) : undefined, // Ensure genre_id is number
    };
    // Remove 'genre' string field if present, as we use genre_id
    if ("genre" in payload) {
      delete payload.genre;
    }

    try {
      const result = await updateProject(project.id, payload);
      toast.success("Project details updated successfully!");
      onProjectUpdated(result);
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleCloseModal = () => {
    reset(); // Reset form on cancel/close
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title="Edit Project Details"
      size="lg"
      footerContent={
        <>
          <Button
            variant="ghost"
            onClick={handleCloseModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-project-form"
            disabled={isSubmitting || isFetchingGenres || !isDirty}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </>
      }
    >
      <form
        id="edit-project-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Title <span className="text-destructive">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="title"
                placeholder="e.g., The Cosmic Labyrinth"
                className={errors.title ? "border-destructive" : ""}
                disabled={isSubmitting || isFetchingGenres}
              />
            )}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="genre_id"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Genre <span className="text-destructive">*</span>
          </label>
          <Controller
            name="genre_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="genre_id"
                value={field.value?.toString() ?? ""} // Handle number to string for select
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value, 10) : undefined
                  )
                }
                className={`block w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.genre_id ? "border-destructive" : "border-input"
                }`}
                disabled={isSubmitting || isFetchingGenres}
              >
                <option value="">
                  {isFetchingGenres ? "Loading genres..." : "Select a genre"}
                </option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id.toString()}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.genre_id && (
            <p className="mt-1 text-xs text-destructive">
              {errors.genre_id.message}
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
          <Controller
            name="log_line"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value || ""}
                id="log_line"
                placeholder="A brief summary or logline for your novel."
                rows={3}
                className={errors.log_line ? "border-destructive" : ""}
                disabled={isSubmitting || isFetchingGenres}
              />
            )}
          />
          {errors.log_line && (
            <p className="mt-1 text-xs text-destructive">
              {errors.log_line.message}
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
          <Controller
            name="target_word_count"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""} // Handle number for input type="number"
                id="targetWordCount"
                type="number"
                placeholder="e.g., 80000"
                min="0"
                className={errors.target_word_count ? "border-destructive" : ""}
                disabled={isSubmitting || isFetchingGenres}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value, 10)
                  )
                }
              />
            )}
          />
          {errors.target_word_count && (
            <p className="mt-1 text-xs text-destructive">
              {errors.target_word_count.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
