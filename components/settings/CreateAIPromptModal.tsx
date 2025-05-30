"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  aiPromptSchema,
  type AIPromptFormData,
} from "@/lib/schemas/aiPrompt.schema";
import { createAIPrompt } from "@/lib/data/aiPrompts";
import { toast } from "sonner";
import { type AIPrompt } from "@/lib/types";
import type { z } from "zod";

interface CreateAIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptCreated: (newPrompt: AIPrompt) => void;
}

// For creation, use only name, prompt_text, category
const createFormSchema = aiPromptSchema.pick({
  name: true,
  prompt_text: true,
  category: true,
});
type CreateAIPromptFormValues = z.infer<typeof createFormSchema>;

export function CreateAIPromptModal({
  isOpen,
  onClose,
  onPromptCreated,
}: CreateAIPromptModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateAIPromptFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      prompt_text: "",
      category: "",
    },
  });

  const onSubmit = async (data: CreateAIPromptFormValues) => {
    try {
      const newPrompt = await createAIPrompt(data as AIPromptFormData);
      toast.success(`AI Prompt "${newPrompt.name}" created successfully.`);
      onPromptCreated(newPrompt);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create AI prompt:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not create AI prompt."
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create New AI Prompt"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="prompt-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="prompt-name"
                {...field}
                className="mt-1"
                aria-invalid={errors.name ? "true" : "false"}
              />
            )}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="prompt-category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category (Optional)
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Input
                id="prompt-category"
                {...field}
                value={field.value || ""}
                placeholder="e.g., Character Development, Plot Twist"
                className="mt-1"
                aria-invalid={errors.category ? "true" : "false"}
              />
            )}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="prompt-text"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt Text
          </label>
          <Controller
            name="prompt_text"
            control={control}
            render={({ field }) => (
              <Textarea
                id="prompt-text"
                {...field}
                rows={10}
                className="mt-1"
                aria-invalid={errors.prompt_text ? "true" : "false"}
              />
            )}
          />
          {errors.prompt_text && (
            <p className="mt-1 text-sm text-red-600">
              {errors.prompt_text.message}
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
            {isSubmitting ? "Creating..." : "Create Prompt"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
