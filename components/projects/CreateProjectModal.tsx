"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { createProjectSchema } from "@/lib/schemas/project.schema";
import type { Project, Genre } from "@/lib/types";
import { createProject } from "@/lib/data/projects";
import { getGenres } from "@/lib/data/genres";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (newProject: Project) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const router = useRouter();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isFetchingGenres, setIsFetchingGenres] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      log_line: undefined,
      target_word_count: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchGenres = async () => {
        setIsFetchingGenres(true);
        try {
          const data = await getGenres();
          setGenres(data);
        } catch (error) {
          console.error("Error fetching genres:", error);
          toast.error("Could not load genres. Please try again.");
        } finally {
          setIsFetchingGenres(false);
        }
      };
      fetchGenres();
    }
  }, [isOpen]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: z.infer<typeof createProjectSchema>) => {
    try {
      const result = await createProject(data);
      toast.success("Novel project created successfully!");
      if (onProjectCreated) {
        onProjectCreated(result);
      }
      handleClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
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
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={isSubmitting || isFetchingGenres}
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
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
          <Input
            id="title"
            type="text"
            {...register("title")}
            placeholder="e.g., The Cosmic Labyrinth"
            disabled={isSubmitting || isFetchingGenres}
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
          <select
            id="genre_id"
            {...register("genre_id", {
              setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
            })}
            className={`block w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.genre_id ? "border-destructive" : "border-input"
            }`}
            disabled={isSubmitting || isFetchingGenres}
          >
            <option value="">
              {isFetchingGenres ? "Loading genres..." : "Select a genre"}
            </option>
            {genres.map((g: Genre) => (
              <option key={g.id} value={g.id.toString()}>
                {g.name}
              </option>
            ))}
          </select>
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
          <Textarea
            id="log_line"
            {...register("log_line")}
            placeholder="A brief summary or logline for your novel."
            rows={3}
            disabled={isSubmitting || isFetchingGenres}
          />
          {errors.log_line && (
            <p className="mt-1 text-xs text-destructive">
              {errors.log_line.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="target_word_count"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Target Word Count (Optional)
          </label>
          <Input
            id="target_word_count"
            type="number"
            {...register("target_word_count", {
              setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
            })}
            placeholder="e.g., 80000"
            min="0"
            disabled={isSubmitting || isFetchingGenres}
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
