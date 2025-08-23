// components/settings/EditAIPromptModal.tsx
"use client";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import {
  aiPromptSchema,
  type AIPromptFormData,
} from "../../lib/schemas/aiPrompt.schema";
import { type AIPrompt } from "../../lib/types";
import type { z } from "zod";
import { useSettingsStore } from "../../lib/stores/settingsStore";

interface EditAIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: AIPrompt | null;
}

const editFormSchema = aiPromptSchema.pick({
  name: true,
  prompt_text: true,
  category: true,
});

type EditAIPromptFormValues = z.infer<typeof editFormSchema>;

export function EditAIPromptModal({
  isOpen,
  onClose,
  initialData,
}: EditAIPromptModalProps) {
  const updatePrompt = useSettingsStore((state) => state.updatePrompt);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditAIPromptFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: "",
      prompt_text: "",
      category: "",
    },
  });

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        name: initialData.name,
        prompt_text: initialData.prompt_text,
        category: initialData.category ?? "",
      });
    }
  }, [initialData, isOpen, reset]);

  const onSubmit = async (data: EditAIPromptFormValues) => {
    if (!initialData?.id) return;

    const updated = await updatePrompt(
      initialData.id,
      data as Partial<AIPromptFormData>
    );
    if (updated) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit AI Prompt" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="edit-prompt-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="edit-prompt-name"
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
            htmlFor="edit-prompt-category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category (Optional)
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Input
                id="edit-prompt-category"
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
            htmlFor="edit-prompt-text"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Prompt Text
          </label>
          <Controller
            name="prompt_text"
            control={control}
            render={({ field }) => (
              <Textarea
                id="edit-prompt-text"
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
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
