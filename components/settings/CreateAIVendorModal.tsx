"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  aiVendorSchema,
  type AIVendorFormData,
} from "@/lib/schemas/aiVendor.schema";
import { createAIVendor } from "@/lib/data/aiVendors";
import { toast } from "sonner";
import { type AIVendor } from "@/lib/types";

interface CreateAIVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated: (newVendor: AIVendor) => void;
}

export function CreateAIVendorModal({
  isOpen,
  onClose,
  onVendorCreated,
}: CreateAIVendorModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AIVendorFormData>({
    resolver: zodResolver(aiVendorSchema),
    defaultValues: {
      name: "",
      api_key_env_var: "",
    },
  });

  const onSubmit = async (data: AIVendorFormData) => {
    try {
      const newVendor = await createAIVendor(data);
      toast.success(`AI Vendor "${newVendor.name}" created successfully.`);
      onVendorCreated(newVendor);
      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create AI vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not create AI vendor."
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
      title="Create New AI Vendor"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Vendor Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="name"
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
            htmlFor="api_key_env_var"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            API Key Environment Variable (Optional)
          </label>
          <Controller
            name="api_key_env_var"
            control={control}
            render={({ field }) => (
              <Input
                id="api_key_env_var"
                {...field}
                value={field.value || ""}
                placeholder="e.g., OPENAI_API_KEY"
                className="mt-1"
                aria-invalid={errors.api_key_env_var ? "true" : "false"}
              />
            )}
          />
          {errors.api_key_env_var && (
            <p className="mt-1 text-sm text-red-600">
              {errors.api_key_env_var.message}
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
            {isSubmitting ? "Creating..." : "Create Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
