"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type WorldBuildingNote } from "@/lib/types";
import {
  worldBuildingNoteBaseSchema,
  type WorldBuildingNoteFormValues,
} from "@/lib/schemas/worldBuildingNote.schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import {
  updateWorldBuildingNote,
  deleteWorldBuildingNote,
} from "@/lib/data/worldBuildingNotes";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog"; // Assuming AlertDialog is in ui

interface WorldNoteEditorProps {
  projectId: string;
  note: WorldBuildingNote;
  onSave: (updatedNote: WorldBuildingNote) => void;
  onDelete: (noteId: string) => void;
  onCancelEdit: () => void; // Add this prop for cancel button
  isSaving?: boolean; // Optional prop to indicate saving state from parent
  isDeleting?: boolean; // Optional prop to indicate deleting state from parent
}

const formSchema = worldBuildingNoteBaseSchema;

export function WorldNoteEditor({
  projectId,
  note,
  onSave,
  onDelete,
  onCancelEdit,
  isSaving: parentIsSaving = false, // Default to false if not provided
  isDeleting: parentIsDeleting = false, // Default to false if not provided
}: WorldNoteEditorProps) {
  const [internalIsSaving, setInternalIsSaving] = useState(false);
  const [internalIsDeleting, setInternalIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const isEffectivelySaving = parentIsSaving || internalIsSaving;
  const isEffectivelyDeleting = parentIsDeleting || internalIsDeleting;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WorldBuildingNoteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title || "",
      content: note.content || "",
      category: note.category || "",
    },
  });

  useEffect(() => {
    reset({
      title: note.title || "",
      content: note.content || "",
      category: note.category || "",
    });
  }, [note, reset]);

  const onSubmit = async (data: WorldBuildingNoteFormValues) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }
    setInternalIsSaving(true);
    try {
      const updatedNote = await updateWorldBuildingNote(
        projectId,
        note.id,
        data
      );
      toast.success(`Note "${updatedNote.title}" updated successfully.`);
      onSave(updatedNote);
      reset(updatedNote); // Reset form with new data to clear dirty state
      onCancelEdit(); // Call to switch back to view mode after save
    } catch (error) {
      console.error("Failed to update world note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update world note."
      );
    } finally {
      setInternalIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setInternalIsDeleting(true);
    setIsAlertOpen(false); // Close dialog before async operation
    try {
      await deleteWorldBuildingNote(projectId, note.id);
      toast.success(`Note "${note.title}" deleted successfully.`);
      onDelete(note.id);
      // No need to reset form as the component will likely unmount or data will change
    } catch (error) {
      console.error("Failed to delete world note:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete world note."
      );
    } finally {
      setInternalIsDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-card h-full overflow-y-auto">
      <form
        onSubmit={handleSubmit(onSubmit)}
        id={`worldNoteEditorForm-${note.id}`}
      >
        <div className="space-y-6">
          <div>
            <label
              htmlFor={`title-${note.id}`}
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
              }) => (
                <Input
                  id={`title-${note.id}`}
                  {...field}
                  disabled={isEffectivelySaving || isEffectivelyDeleting}
                />
              )}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`category-${note.id}`}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Category
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
                  id={`category-${note.id}`}
                  {...field}
                  value={field.value || ""}
                  placeholder="e.g., Locations, Magic Systems, Technology"
                  disabled={isEffectivelySaving || isEffectivelyDeleting}
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
              htmlFor={`content-${note.id}`}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Content (Markdown supported)
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
                  id={`content-${note.id}`}
                  {...field}
                  value={field.value || ""}
                  rows={15} // Generous row count for content
                  placeholder="Detailed notes about this aspect of your world..."
                  disabled={isEffectivelySaving || isEffectivelyDeleting}
                  className="min-h-[300px]" // Ensure a decent minimum height
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
      <div className="mt-8 flex justify-between items-center">
        <Button
          type="submit"
          form={`worldNoteEditorForm-${note.id}`}
          disabled={!isDirty || isEffectivelySaving || isEffectivelyDeleting}
        >
          {isEffectivelySaving ? "Saving..." : "Save Changes"}
        </Button>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isEffectivelySaving || isEffectivelyDeleting}
              onClick={() => setIsAlertOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                world note titled - {note.title}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={internalIsDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={internalIsDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {internalIsDeleting ? "Deleting..." : "Yes, delete note"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
