"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithOtp } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function Loading() {
  return <div>Loading...</div>;
}

function LoginContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleOtpLogin = async (formData: FormData) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const result = await signInWithOtp(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setMessage("Check your email for the magic link!");
    }

    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(`Google Sign-In failed: ${oauthError.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <Heading level={2} className="mb-2">
            Sign in to Snowscribe
          </Heading>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Use Google or a magic link sent to your email.
          </Paragraph>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form action={handleOtpLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending Link..." : "Send Magic Link"}
          </Button>
        </form>

        <div className="relative my-4">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          Sign In with Google
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginContent />
    </Suspense>
  );
}
