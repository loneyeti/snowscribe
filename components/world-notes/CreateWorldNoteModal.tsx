// components/world-notes/CreateWorldNoteModal.tsx
"use client";
import React, { useState } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  worldBuildingNoteBaseSchema,
  type WorldBuildingNoteFormValues,
} from "@/lib/schemas/worldBuildingNote.schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { useProjectStore } from "@/lib/stores/projectStore"; // Import store

interface CreateWorldNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
}

const formSchema = worldBuildingNoteBaseSchema;

export function CreateWorldNoteModal({
  isOpen,
  onClose,
  initialContent,
}: CreateWorldNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createWorldNote = useProjectStore((state) => state.createWorldNote); // Get action

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorldBuildingNoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", content: initialContent || "", category: "" },
  });

  const onSubmit = async (data: WorldBuildingNoteFormValues) => {
    setIsSubmitting(true);
    const transformedData = {
      ...data,
      category: data.category ?? undefined,
      content: data.content ?? undefined,
    };
    const newNote = await createWorldNote(transformedData); // Call store action
    if (newNote) {
      reset();
      onClose();
    }
    setIsSubmitting(false);
  };

  if (!isOpen) {
    return null;
  }

  const modalFooterContent = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
        className="mr-2"
      >
        Cancel
      </Button>
      <Button type="submit" form="createWorldNoteForm" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Note"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New World Note"
      footerContent={modalFooterContent}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} id="createWorldNoteForm">
        {/* Form fields remain the same */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title
            </label>
            <Controller
              name="title"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  WorldBuildingNoteFormValues,
                  "title"
                >;
              }) => <Input id="title" {...field} />}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category (Optional)
            </label>
            <Controller
              name="category"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  WorldBuildingNoteFormValues,
                  "category"
                >;
              }) => (
                <Input
                  id="category"
                  {...field}
                  value={field.value || ""}
                  placeholder="e.g., Locations, Magic Systems, Technology"
                />
              )}
            />
            {errors.category && (
              <p className="text-xs text-red-600 mt-1">
                {errors.category.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Content (Optional, Markdown supported)
            </label>
            <Controller
              name="content"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  WorldBuildingNoteFormValues,
                  "content"
                >;
              }) => (
                <Textarea
                  id="content"
                  {...field}
                  value={field.value || ""}
                  rows={10}
                  placeholder="Detailed notes about this aspect of your world..."
                />
              )}
            />
            {errors.content && (
              <p className="text-xs text-red-600 mt-1">
                {errors.content.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
