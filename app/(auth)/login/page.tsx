import { AuthForm } from "@/components/auth/AuthForm";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";
import { login, signup } from "./actions"; // Import the server actions

export default function LoginPage() {
  // The handleLogin and handleSignup logic is now in ./actions.ts
  // We will pass the server actions directly to AuthForm.
  // AuthForm will need to be adapted to call these actions with FormData.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <Heading level={2} className="mb-2">
            Login to Snowscribe
          </Heading>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Enter your credentials to access your projects.
          </Paragraph>
        </div>
        {/* Pass the server actions to AuthForm */}
        {/* AuthForm will need to be updated to use these actions with FormData */}
        <AuthForm
          initialVariant="login"
          onLoginSubmit={login}
          onSignupSubmit={signup}
        />
        <Paragraph className="text-sm text-center text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </Paragraph>
        <Paragraph className="text-sm text-center text-gray-600 dark:text-gray-400">
          Forgot your password?{" "}
          <Link
            href="/password-reset"
            className="font-medium text-primary hover:underline"
          >
            Reset it here
          </Link>
        </Paragraph>
      </div>
    </div>
  );
}
