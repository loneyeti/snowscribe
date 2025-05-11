"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
// import { cookies } from "next/headers"; // No longer needed

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  // const cookieStore = cookies(); // Not needed here, createClient handles it
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // It's better to return an error object or message
    // than to redirect to an error page directly from an action.
    // The calling component can then decide how to display the error.
    // For now, per Supabase docs example, redirecting to an error page.
    // Consider changing this to return { error: error.message }
    console.error("Login error:", error.message);
    return redirect("/login?error=Could not authenticate user");
  }

  // On successful login, Supabase handles setting the session cookie.
  // The middleware should then ensure the session is refreshed.
  // Redirect to the main app page or a dashboard.
  return redirect("/"); // Or a more specific dashboard page e.g., /dashboard
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  // const cookieStore = cookies(); // Not needed here, createClient handles it
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensure your Supabase project's email templates are configured to use this path.
      // See Supabase docs: Auth > Templates. The "Confirm signup" template should use
      // {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email (if using 'callback' as route)
      // or {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email (if using 'confirm' as route)
      // The project uses /auth/callback.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error("Signup error:", error.message);
    // Instead of redirecting here, it's often better to return the error
    // and let the form component display it. However, to match current pattern:
    return redirect(`/login?error=Could not sign up user: ${error.message}`);
  }

  // If email confirmation is enabled (default), Supabase sends an email.
  // Redirect to a page informing the user to check their email.
  // For now, redirecting to login page with a message.
  // A dedicated page like /auth/check-email would be better UX.
  return redirect("/login?message=Signup successful! Please check your email to confirm your account.");
}
