// app/profile/ProfileClientPage.tsx
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfileStore } from "@/lib/stores/profileStore";
import { useShallow } from "zustand/react/shallow";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/lib/schemas/profile.schema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";

export function ProfileClientPage() {
  const { profile, isLoading, isSaving, updateProfile } = useProfileStore(
    useShallow((state) => ({
      profile: state.profile,
      isLoading: state.isLoading,
      isSaving: state.isSaving,
      updateProfile: state.updateProfile,
    }))
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: "",
      pen_name: "",
    },
  });

  useEffect(() => {
    // When the profile loads from the store, reset the form with that data.
    if (profile) {
      reset({
        full_name: profile.full_name || "",
        pen_name: profile.pen_name || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: UpdateProfileValues) => {
    updateProfile(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <p>Could not load profile information.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Profile</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-card p-8 rounded-lg border"
      >
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-muted-foreground"
          >
            Full Name
          </label>
          <Input
            id="full_name"
            {...register("full_name")}
            className="mt-1"
            aria-invalid={errors.full_name ? "true" : "false"}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="pen_name"
            className="block text-sm font-medium text-muted-foreground"
          >
            Pen Name (Optional)
          </label>
          <Input
            id="pen_name"
            {...register("pen_name")}
            className="mt-1"
            aria-invalid={errors.pen_name ? "true" : "false"}
          />
          {errors.pen_name && (
            <p className="mt-1 text-sm text-red-600">
              {errors.pen_name.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
