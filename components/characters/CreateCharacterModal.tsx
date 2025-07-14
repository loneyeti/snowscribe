"use client";
import React, { useState } from "react";
import { useForm, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type CharacterFormValues } from "@/lib/types";
import { characterBaseSchema } from "@/lib/schemas/character.schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { useProjectStore } from "@/lib/stores/projectStore"; // Import the store

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = characterBaseSchema;

export function CreateCharacterModal({
  isOpen,
  onClose,
}: CreateCharacterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Get the createCharacter action directly from the store
  const createCharacter = useProjectStore((state) => state.createCharacter);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      notes: "",
      image_url: "",
    },
  });

  const onSubmit = async (data: CharacterFormValues) => {
    setIsSubmitting(true);
    // The store action already knows the projectId
    const newCharacter = await createCharacter(data);

    // The store action now handles the toast messages
    if (newCharacter) {
      reset();
      onClose(); // Close the modal on success
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
      <Button type="submit" form="createCharacterForm" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Character"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Character"
      footerContent={modalFooterContent}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} id="createCharacterForm">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <Controller
              name="name"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<CharacterFormValues, "name">;
              }) => <Input id="name" {...field} />}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <Controller
              name="description"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<
                  CharacterFormValues,
                  "description"
                >;
              }) => (
                <Textarea
                  id="description"
                  {...field}
                  value={field.value || ""}
                  rows={3}
                />
              )}
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes (Optional)
            </label>
            <Controller
              name="notes"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<CharacterFormValues, "notes">;
              }) => (
                <Textarea
                  id="notes"
                  {...field}
                  value={field.value || ""}
                  rows={5}
                  placeholder="Detailed notes, backstory, motivations, appearance etc."
                />
              )}
            />
            {errors.notes && (
              <p className="text-xs text-red-600 mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="image_url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Image URL (Optional)
            </label>
            <Controller
              name="image_url"
              control={control}
              render={({
                field,
              }: {
                field: ControllerRenderProps<CharacterFormValues, "image_url">;
              }) => (
                <Input
                  id="image_url"
                  {...field}
                  value={field.value ?? ""}
                  placeholder="https://..."
                />
              )}
            />
            {errors.image_url && (
              <p className="text-xs text-red-600 mt-1">
                {errors.image_url.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
