import { AuthForm } from "@/components/auth/AuthForm";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";
import { signup } from "../login/actions"; // Import the server action

export default function RegisterPage() {
  // The handleSignup logic is now in ../login/actions.ts
  // We will pass the server action directly to AuthForm.

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <Heading level={2} className="mb-2">
            Create your Snowscribe Account
          </Heading>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Join us and start writing your next masterpiece.
          </Paragraph>
        </div>
        <AuthForm initialVariant="signup" onSignupSubmit={signup} />
        <Paragraph className="text-sm text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
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
