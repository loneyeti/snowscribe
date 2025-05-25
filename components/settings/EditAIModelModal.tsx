"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { aiModelSchema } from "@/lib/schemas/aiModel.schema";
import { z } from "zod";
import { updateAIModel } from "@/lib/data/aiModels";
import { toast } from "sonner";
import { type AIVendor, type AIModel } from "@/lib/types";

interface EditAIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUpdated: (updatedModel: AIModel) => void;
  vendors: AIVendor[];
  initialData: AIModel | null; // Pass the model data to pre-fill the form
}

// Define input type for the form based on the Zod schema
type AIModelFormInputValues = z.input<typeof aiModelSchema>;

export function EditAIModelModal({
  isOpen,
  onClose,
  onModelUpdated,
  vendors,
  initialData,
}: EditAIModelModalProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AIModelFormInputValues>({
    resolver: zodResolver(aiModelSchema),
    defaultValues: {
      // Set default values from initialData, handling null/undefined
      name: initialData?.name ?? "",
      api_name: initialData?.api_name ?? "",
      vendor_id:
        initialData?.vendor_id ?? (vendors.length > 0 ? vendors[0].id : ""),
      is_vision: initialData?.is_vision ?? false,
      is_image_generation: initialData?.is_image_generation ?? false,
      is_thinking: initialData?.is_thinking ?? false,
      max_tokens: initialData?.max_tokens ?? 4096,
      input_token_cost_micros: initialData?.input_token_cost_micros ?? 0,
      output_token_cost_micros: initialData?.output_token_cost_micros ?? 0,
      notes: initialData?.notes ?? null,
    },
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        name: initialData.name,
        api_name: initialData.api_name,
        vendor_id: initialData.vendor_id,
        is_vision: initialData.is_vision,
        is_image_generation: initialData.is_image_generation,
        is_thinking: initialData.is_thinking,
        max_tokens: initialData.max_tokens,
        input_token_cost_micros: initialData.input_token_cost_micros,
        output_token_cost_micros: initialData.output_token_cost_micros,
        notes: initialData.notes,
      });
    } else if (!isOpen) {
      // Optionally reset when closing if needed, though reset on open is primary
      // reset();
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: AIModelFormInputValues) => {
    if (!initialData?.id) {
      toast.error("Cannot update model: ID is missing.");
      return;
    }

    try {
      // Re-parse data with the schema to get the correctly typed output.
      const validatedData = aiModelSchema.parse(data); // This will be AIModelFormOutputValues

      // Only send fields that have changed? Or send all? Sending all is simpler for now.
      const updatedModel = await updateAIModel(initialData.id, validatedData);
      toast.success(`AI Model "${updatedModel.name}" updated successfully.`);
      onModelUpdated(updatedModel);
      // No need to reset here, as the modal will close and initialData will change
      onClose();
    } catch (error) {
      console.error("Failed to update AI model:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not update AI model."
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose} // Don't reset on close here, reset happens on open/initialData change
      title="Edit AI Model"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="edit-name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <Input
            id="edit-name"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-api_name"
            className="block text-sm font-medium text-gray-700"
          >
            API Name (Vendor Specific)
          </label>
          <Input
            id="edit-api_name"
            {...register("api_name")}
            aria-invalid={errors.api_name ? "true" : "false"}
          />
          {errors.api_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.api_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="edit-vendor_id"
            className="block text-sm font-medium text-gray-700"
          >
            Vendor
          </label>
          <select
            id="edit-vendor_id"
            {...register("vendor_id")}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            aria-invalid={errors.vendor_id ? "true" : "false"}
          >
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
          {errors.vendor_id && (
            <p className="mt-1 text-sm text-red-600">
              {errors.vendor_id.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="edit-max_tokens"
              className="block text-sm font-medium text-gray-700"
            >
              Max Tokens
            </label>
            <Input
              id="edit-max_tokens"
              type="number"
              {...register("max_tokens", { valueAsNumber: true })} // Ensure number type
              aria-invalid={errors.max_tokens ? "true" : "false"}
            />
            {errors.max_tokens && (
              <p className="mt-1 text-sm text-red-600">
                {errors.max_tokens.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="edit-input_token_cost_micros"
              className="block text-sm font-medium text-gray-700"
            >
              Input Cost (Micros)
            </label>
            <Input
              id="edit-input_token_cost_micros"
              type="number"
              {...register("input_token_cost_micros", { valueAsNumber: true })} // Ensure number type
              aria-invalid={errors.input_token_cost_micros ? "true" : "false"}
            />
            {errors.input_token_cost_micros && (
              <p className="mt-1 text-sm text-red-600">
                {errors.input_token_cost_micros.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="edit-output_token_cost_micros"
              className="block text-sm font-medium text-gray-700"
            >
              Output Cost (Micros)
            </label>
            <Input
              id="edit-output_token_cost_micros"
              type="number"
              {...register("output_token_cost_micros", { valueAsNumber: true })} // Ensure number type
              aria-invalid={errors.output_token_cost_micros ? "true" : "false"}
            />
            {errors.output_token_cost_micros && (
              <p className="mt-1 text-sm text-red-600">
                {errors.output_token_cost_micros.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Controller
              name="is_vision"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="edit-is_vision"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="edit-is_vision"
              className="text-sm font-medium text-gray-700"
            >
              Supports Vision
            </label>
          </div>
          {errors.is_vision && (
            <p className="mt-1 text-sm text-red-600">
              {errors.is_vision.message}
            </p>
          )}

          <div className="flex items-center">
            <Controller
              name="is_image_generation"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="edit-is_image_generation"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="edit-is_image_generation"
              className="text-sm font-medium text-gray-700"
            >
              Supports Image Generation
            </label>
          </div>
          {errors.is_image_generation && (
            <p className="mt-1 text-sm text-red-600">
              {errors.is_image_generation.message}
            </p>
          )}

          <div className="flex items-center">
            <Controller
              name="is_thinking"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="edit-is_thinking"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="edit-is_thinking"
              className="text-sm font-medium text-gray-700"
            >
              Is Thinking Model (for snowgander)
            </label>
          </div>
          {errors.is_thinking && (
            <p className="mt-1 text-sm text-red-600">
              {errors.is_thinking.message}
            </p>
          )}
        </div>

        {/* Optional Notes field - uncomment if needed
        <div>
          <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
          <Input id="edit-notes" {...register("notes")} />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
        </div>
        */}

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
