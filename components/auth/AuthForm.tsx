"use client"; // This component will need client-side interactivity

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Heading, Paragraph } from "@/components/typography";

type AuthFormVariant = "login" | "signup";

// No longer need AuthSubmissionData, actions expect FormData
// interface AuthSubmissionData {
//   email: string;
//   password: string;
// }

export interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  initialVariant?: AuthFormVariant;
  onLoginSubmit?: (formData: FormData) => Promise<void> | void; // Expect FormData
  onSignupSubmit?: (formData: FormData) => Promise<void> | void; // Expect FormData
  // Add other props like error messages, loading states, etc.
}

const AuthForm = React.forwardRef<HTMLDivElement, AuthFormProps>(
  (
    {
      className,
      initialVariant = "login",
      onLoginSubmit,
      onSignupSubmit,
      ...props
    },
    ref
  ) => {
    const [variant, setVariant] =
      React.useState<AuthFormVariant>(initialVariant);
    // Email, password, confirmPassword states are no longer needed here
    // as FormData will read directly from the form inputs.
    // const [email, setEmail] = React.useState("");
    // const [password, setPassword] = React.useState("");
    // const [confirmPassword, setConfirmPassword] = React.useState(""); // For signup
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const toggleVariant = React.useCallback(() => {
      setVariant((prevVariant) =>
        prevVariant === "login" ? "signup" : "login"
      );
      setError(null); // Clear errors when switching forms
      // Clearing password fields is good UX, but values are now in the DOM not state
      // Consider resetting the form fields directly if needed, e.g. event.currentTarget.reset()
      // setPassword("");
      // setConfirmPassword("");
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setIsLoading(true);
      setError(null);

      if (variant === "signup") {
        // Password confirmation can still be done client-side before submitting
        const pass = formData.get("password") as string;
        const confirmPass = formData.get("confirm-password") as string;
        if (pass !== confirmPass) {
          setError("Passwords do not match.");
          setIsLoading(false);
          return;
        }

        if (onSignupSubmit) {
          try {
            await onSignupSubmit(formData);
          } catch (e: unknown) {
            // Check if it's a Next.js redirect error
            if (
              typeof e === "object" &&
              e !== null &&
              "digest" in e &&
              typeof (e as { digest: string }).digest === "string" &&
              (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
            ) {
              // This is a redirect error, re-throw it to let Next.js handle the redirect.
              throw e;
            }
            // Handle other errors
            if (e instanceof Error) {
              setError(e.message);
            } else if (typeof e === "string") {
              setError(e);
            } else {
              setError("Signup failed. Please try again.");
            }
          }
        }
      } else {
        // Login
        if (onLoginSubmit) {
          try {
            await onLoginSubmit(formData);
          } catch (e: unknown) {
            // Check if it's a Next.js redirect error
            if (
              typeof e === "object" &&
              e !== null &&
              "digest" in e &&
              typeof (e as { digest: string }).digest === "string" &&
              (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
            ) {
              throw e; // Re-throw redirect errors
            }
            // Handle other errors
            if (e instanceof Error) {
              setError(e.message);
            } else if (typeof e === "string") {
              setError(e);
            } else {
              setError("Login failed. Please try again.");
            }
          }
        }
      }
      setIsLoading(false);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-lg",
          className
        )}
        {...props}
      >
        <Heading level={2} className="text-center">
          {variant === "login" ? "Welcome Back" : "Create an Account"}
        </Heading>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Email address"
            // value={email} // No longer controlled by React state
            // onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              variant === "login" ? "current-password" : "new-password"
            }
            required
            placeholder="Password"
            // value={password} // No longer controlled by React state
            // onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {variant === "signup" && (
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Confirm Password"
              // value={confirmPassword} // No longer controlled by React state
              // onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          )}

          {error && (
            <Paragraph variant="small" className="text-destructive text-center">
              {error}
            </Paragraph>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : variant === "login"
              ? "Log In"
              : "Sign Up"}
          </Button>
        </form>

        <Paragraph variant="small" className="text-center">
          {variant === "login"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={toggleVariant}
            className="font-medium text-primary hover:underline focus:outline-none"
            disabled={isLoading}
          >
            {variant === "login" ? "Sign up" : "Log in"}
          </button>
        </Paragraph>
      </div>
    );
  }
);
AuthForm.displayName = "AuthForm";

export { AuthForm };
