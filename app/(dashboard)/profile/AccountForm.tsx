"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import { Paragraph } from "@/components/typography/Paragraph";

interface AccountFormProps {
  user: User;
}

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type EmailFormValues = z.infer<typeof emailSchema>;

export function AccountForm({ user }: AccountFormProps) {
  const supabase = createClient();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user.email || "",
    },
  });

  const onSubmit = async (data: EmailFormValues) => {
    if (data.email === user.email) {
      toast.info("This is already your current email address.");
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { email: data.email },
      { emailRedirectTo: `${window.location.origin}/profile` }
    );

    if (error) {
      toast.error(getErrorMessage(error));
    } else {
      toast.success(
        "Confirmation emails have been sent to both your old and new addresses. Please check your inboxes to complete the change."
      );
      reset({ email: data.email });
    }
  };

  return (
    <div className="space-y-6">
      <Paragraph>
        Your current email address is <strong>{user.email}</strong>. To change
        it, enter a new address below. You will need to confirm the change from
        both your old and new email inboxes.
      </Paragraph>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-muted-foreground mb-1"
          >
            New Email Address
          </label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="new.email@example.com"
                disabled={isSubmitting}
              />
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Sending..." : "Update Email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
