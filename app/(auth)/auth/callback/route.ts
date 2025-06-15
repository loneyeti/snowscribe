import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/"; // Default redirect to homepage

  // Create a Supabase client
  const supabase = await createClient();

  // Handle Magic Link / OTP verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // Redirect to the 'next' URL on success
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OTP Verification Error:", error.message);
  }

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the 'next' URL on success
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code Exchange Error:", error.message);
  }

  // If there's an error in either flow, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
