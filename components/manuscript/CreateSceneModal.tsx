"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createSceneSchema } from "@/lib/schemas/scene.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// This schema validates only the fields managed by the form
const formSchema = createSceneSchema.pick({
  title: true,
  primary_category: true,
});
type SceneFormValues = z.infer<typeof formSchema>;

interface CreateSceneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSceneCreated: (data: SceneFormValues) => void;
}

export function CreateSceneModal({
  isOpen,
  onClose,
  onSceneCreated,
}: CreateSceneModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SceneFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      primary_category: undefined,
    },
  });

  const onSubmit = (data: SceneFormValues) => {
    onSceneCreated(data);
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
      title="Create New Scene"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter a title for your new scene.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {...register("title")}
              placeholder="e.g., The Discovery"
              className="w-full"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">
                {errors.title.message}
              </p>
            )}
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
              {...register("primary_category")}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              disabled={isSubmitting}
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
            {errors.primary_category && (
              <p className="text-sm text-red-600 mt-1">
                {errors.primary_category.message}
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
              {isSubmitting ? "Creating..." : "Create Scene"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
