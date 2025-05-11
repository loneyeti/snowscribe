"use client"; // Needs client-side interactivity for form handling

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; // Using browser client

export default function PasswordResetRequestPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    const { error: RpcError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      }
    );

    setIsLoading(false);
    if (RpcError) {
      setError(RpcError.message);
    } else {
      setMessage("Password reset link sent. Please check your email.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <Heading level={2} className="mb-2">
            Reset Your Password
          </Heading>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Enter your email address and we will send you a link to reset your
            password.
          </Paragraph>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <Paragraph className="text-sm text-center">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </Paragraph>
      </div>
    </div>
  );
}
