"use client";
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  updateToolModelValuesSchema,
  type UpdateToolModelValues,
  type ToolModelWithAIModel,
} from "@/lib/schemas/toolModel.schema";
import { type AIModel } from "@/lib/types";
import { updateToolModel } from "@/lib/data/toolModels";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

interface EditToolModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolModelUpdated: (updatedToolModel: ToolModelWithAIModel) => void;
  toolModel: ToolModelWithAIModel | null;
  aiModels: AIModel[]; // List of all available AI models for the dropdown
}

export function EditToolModelModal({
  isOpen,
  onClose,
  onToolModelUpdated,
  toolModel,
  aiModels,
}: EditToolModelModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<UpdateToolModelValues>({
    resolver: zodResolver(updateToolModelValuesSchema),
    defaultValues: {
      model_id: toolModel?.model_id || "",
    },
  });

  useEffect(() => {
    if (toolModel) {
      reset({ model_id: toolModel.model_id });
    } else {
      reset({ model_id: "" });
    }
  }, [toolModel, reset, isOpen]);

  const onSubmit = async (data: UpdateToolModelValues) => {
    if (!toolModel) return;

    try {
      const updated = await updateToolModel(toolModel.id, data);
      toast.success(`Tool Model "${toolModel.name}" updated successfully.`);
      onToolModelUpdated(updated);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
      console.error("Failed to update tool model:", error);
    }
  };

  if (!toolModel) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Tool Model: ${toolModel.name}`}
      footerContent={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-tool-model-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </>
      }
    >
      <form
        id="edit-tool-model-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="toolModelName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tool Name
          </label>
          <Input
            id="toolModelName"
            type="text"
            value={toolModel.name}
            disabled
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label
            htmlFor="model_id"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            AI Model
          </label>
          <Controller
            name="model_id"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="model_id"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-background-secondary dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="">Select an AI Model</option>
                {aiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.api_name})
                  </option>
                ))}
              </select>
            )}
          />
          {errors.model_id && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.model_id.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
