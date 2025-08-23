// components/settings/CreateAIModelModal.tsx
"use client";
import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Checkbox } from "../../components/ui/Checkbox";
import { aiModelSchema } from "../../lib/schemas/aiModel.schema";
import { z } from "zod";
import { toast } from "sonner";
import { type AIVendor } from "../../lib/types";
import { useSettingsStore } from "../../lib/stores/settingsStore";

interface CreateAIModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: AIVendor[];
}

type AIModelFormInputValues = z.input<typeof aiModelSchema>;

export function CreateAIModelModal({
  isOpen,
  onClose,
  vendors,
}: CreateAIModelModalProps) {
  const createModel = useSettingsStore((state) => state.createModel);
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AIModelFormInputValues>({
    resolver: zodResolver(aiModelSchema),
    defaultValues: {
      name: "",
      api_name: "",
      vendor_id: vendors.length > 0 ? vendors[0].id : "",
      is_vision: false,
      is_image_generation: false,
      is_thinking: false,
      max_tokens: 4096,
      input_token_cost_micros: 0,
      output_token_cost_micros: 0,
      notes: null,
    },
  });

  const onSubmit = async (data: AIModelFormInputValues) => {
    try {
      const validatedData = aiModelSchema.parse(data);
      const newModel = await createModel(validatedData);
      if (newModel) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Validation failed or error during creation:", error);
      if (error instanceof z.ZodError) {
        toast.error("Please check the form for errors.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Create New AI Model"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <Input
            id="name"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="api_name"
            className="block text-sm font-medium text-gray-700"
          >
            API Name (Vendor Specific)
          </label>
          <Input
            id="api_name"
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
            htmlFor="vendor_id"
            className="block text-sm font-medium text-gray-700"
          >
            Vendor
          </label>
          <select
            id="vendor_id"
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
              htmlFor="max_tokens"
              className="block text-sm font-medium text-gray-700"
            >
              Max Tokens
            </label>
            <Input
              id="max_tokens"
              type="number"
              {...register("max_tokens")}
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
              htmlFor="input_token_cost_micros"
              className="block text-sm font-medium text-gray-700"
            >
              Input Cost (Micros)
            </label>
            <Input
              id="input_token_cost_micros"
              type="number"
              {...register("input_token_cost_micros")}
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
              htmlFor="output_token_cost_micros"
              className="block text-sm font-medium text-gray-700"
            >
              Output Cost (Micros)
            </label>
            <Input
              id="output_token_cost_micros"
              type="number"
              {...register("output_token_cost_micros")}
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
                  id="is_vision"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="is_vision"
              className="text-sm font-medium text-gray-700"
            >
              Supports Vision
            </label>
          </div>
          <div className="flex items-center">
            <Controller
              name="is_image_generation"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_image_generation"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="is_image_generation"
              className="text-sm font-medium text-gray-700"
            >
              Supports Image Generation
            </label>
          </div>
          <div className="flex items-center">
            <Controller
              name="is_thinking"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_thinking"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mr-2"
                />
              )}
            />
            <label
              htmlFor="is_thinking"
              className="text-sm font-medium text-gray-700"
            >
              Is Thinking Model (for snowgander)
            </label>
          </div>
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
            {isSubmitting ? "Creating..." : "Create Model"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
