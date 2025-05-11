import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <Heading level={2} className="mb-2 text-destructive">
          Authentication Error
        </Heading>
        <Paragraph className="text-gray-600 dark:text-gray-400">
          There was a problem authenticating your request. This might be due to
          an invalid or expired link.
        </Paragraph>
        <Paragraph className="text-gray-600 dark:text-gray-400 mt-4">
          Please try again or contact support if the issue persists.
        </Paragraph>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
