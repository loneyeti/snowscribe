"use server";

import { createClient } from "@/lib/supabase/server";

// Define a consistent return type for client-side error/success handling
type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function signInWithOtp(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  
  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();

  // The NEXT_PUBLIC_APP_URL from your .env.local file is used here.
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // This will be handled by Supabase's email templates.
      // shouldCreateUser: true is the default, so users will be created if they don't exist.
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("signInWithOtp Error:", error);
    return { error: `Could not send magic link: ${error.message}` };
  }

  // On success, we don't redirect. The client will show a message.
  return { success: true };
}
