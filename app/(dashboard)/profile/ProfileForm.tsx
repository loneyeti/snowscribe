"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/lib/schemas/profile.schema";
import { type Profile } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { updateClientProfile } from "@/lib/data/profiles";
import { getErrorMessage } from "@/lib/utils";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.full_name || "",
      pen_name: profile.pen_name || "",
    },
  });

  const onSubmit = async (data: UpdateProfileValues) => {
    if (!isDirty) {
      toast.info("No changes to save.");
      return;
    }
    try {
      const updatedProfile = await updateClientProfile(data);
      toast.success("Profile updated successfully!");
      reset(updatedProfile); // Reset form with new defaults to clear dirty state
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          Full Name
        </label>
        <Controller
          name="full_name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="full_name"
              placeholder="Your full name"
              disabled={isSubmitting}
              value={field.value ?? ""}
            />
          )}
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-destructive">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="pen_name"
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          Pen Name (for Manuscript Exports)
        </label>
        <Controller
          name="pen_name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id="pen_name"
              placeholder="Your author name"
              disabled={isSubmitting}
            />
          )}
        />
        {errors.pen_name && (
          <p className="mt-1 text-xs text-destructive">
            {errors.pen_name.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
