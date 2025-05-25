"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  aiVendorSchema,
  type AIVendorFormData,
} from "@/lib/schemas/aiVendor.schema";
import { updateAIVendor } from "@/lib/data/aiVendors";
import { toast } from "sonner";
import { type AIVendor } from "@/lib/types";

interface EditAIVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorUpdated: (updatedVendor: AIVendor) => void;
  initialData: AIVendor | null;
}

export function EditAIVendorModal({
  isOpen,
  onClose,
  onVendorUpdated,
  initialData,
}: EditAIVendorModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AIVendorFormData>({
    resolver: zodResolver(aiVendorSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      api_key_env_var: initialData?.api_key_env_var ?? "",
    },
  });

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        name: initialData.name,
        api_key_env_var: initialData.api_key_env_var ?? "",
      });
    }
  }, [initialData, isOpen, reset]);

  const onSubmit = async (data: AIVendorFormData) => {
    if (!initialData?.id) {
      toast.error("Cannot update vendor: ID is missing.");
      return;
    }

    try {
      const updatedVendor = await updateAIVendor(initialData.id, data);
      toast.success(`AI Vendor "${updatedVendor.name}" updated successfully.`);
      onVendorUpdated(updatedVendor);
      onClose();
    } catch (error) {
      console.error("Failed to update AI vendor:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not update AI vendor."
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit AI Vendor">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Vendor Name
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                id="edit-name"
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
            htmlFor="edit-api_key_env_var"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            API Key Environment Variable (Optional)
          </label>
          <Controller
            name="api_key_env_var"
            control={control}
            render={({ field }) => (
              <Input
                id="edit-api_key_env_var"
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
