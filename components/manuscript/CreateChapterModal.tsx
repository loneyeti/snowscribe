"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createChapterSchema } from "@/lib/schemas/chapter.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// This schema defines only the fields managed by our form
const formSchema = createChapterSchema.pick({
  title: true,
});
// This creates a TypeScript type from our form schema
type ChapterFormValues = z.infer<typeof formSchema>;

interface CreateChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChapterCreated: (data: ChapterFormValues) => void;
}

export function CreateChapterModal({
  isOpen,
  onClose,
  onChapterCreated,
}: CreateChapterModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChapterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = (data: ChapterFormValues) => {
    onChapterCreated(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create New Chapter"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a title for your new chapter.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register("title")}
              placeholder="e.g., The Beginning"
              required
              className="w-full"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Chapter"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
