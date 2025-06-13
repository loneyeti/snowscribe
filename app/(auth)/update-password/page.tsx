"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function UpdatePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // This effect handles the case where the user lands on this page
    // after clicking the password reset link in their email.
    // Supabase redirects with a code/token in the URL hash.
    // The onAuthStateChange listener in a root layout or middleware
    // should handle exchanging this for a session and triggering PASSWORD_RECOVERY.

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is now active, user can update password.
        // No need to do anything here as the form will allow submission.
        setMessage(
          "You can now update your password. Please enter and confirm your new password."
        );
      } else if (
        event === "SIGNED_IN" &&
        searchParams.get("next") === "/update-password"
      ) {
        // This might occur if the callback route sets up the session
        // and then redirects here.
        setMessage(
          "Authenticated. Please enter and confirm your new password."
        );
      }
    });

    // Check if there's an error from the redirect (e.g. invalid token)
    const errorParam = searchParams.get("error");
    const errorDescriptionParam = searchParams.get("error_description");
    if (errorParam) {
      setError(errorDescriptionParam || errorParam);
    } else if (!supabase.auth.getSession()) {
      // If no session and no error, it might be an old link or direct navigation
      // For now, we allow proceeding, but a real app might show an error or redirect
      // if no valid password recovery state is detected.
      // setError("Invalid or expired password recovery link.");
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, searchParams, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setMessage(null);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage(
        "Password updated successfully! You can now log in with your new password."
      );
      // Optional: redirect to login after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <Heading level={2} className="mb-2">
            Update Your Password
          </Heading>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Enter your new password below.
          </Paragraph>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />

          {message && (
            <Paragraph className="text-sm text-green-600 dark:text-green-500 text-center">
              {message}
            </Paragraph>
          )}
          {error && (
            <Paragraph className="text-sm text-destructive text-center">
              {error}
            </Paragraph>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
        {message?.includes("successfully") && (
          <Paragraph className="text-sm text-center">
            Redirecting to{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              login
            </Link>
            ...
          </Paragraph>
        )}
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <Paragraph>Loading...</Paragraph>
        </div>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
