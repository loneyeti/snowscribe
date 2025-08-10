import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // CRITICAL: Check for the SITE_URL at the very beginning.
  // This is a server configuration issue, not a user error.
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    console.error("FATAL: SITE_URL environment variable is not set. This is a server configuration error.");
    // Return a generic 500 error. The dev team needs to fix this.
    return new NextResponse(
      "Internal Server Error: Application is not configured correctly.",
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  
  // Always build the redirect URL with the known, safe siteUrl.
  const redirectTo = new URL(next, siteUrl);

  // If the link is missing `type`, it's an invalid link. Redirect to an error page immediately.
  if (token_hash && !type) {
    console.error("Auth callback received `token_hash` but no `type`. Check Supabase email template.");
    const errorUrl = new URL("/auth/auth-code-error", siteUrl);
    errorUrl.searchParams.set("error_description", "Invalid login link. The 'type' parameter is missing.");
    return NextResponse.redirect(errorUrl);
  }

  const supabase = await createClient();

  // Handle Magic Link / OTP verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
    console.error("OTP Verification Error:", error.message);
    const errorUrl = new URL("/auth/auth-code-error", siteUrl);
    errorUrl.searchParams.set("error_description", "Could not verify OTP. The link may be expired or invalid.");
    return NextResponse.redirect(errorUrl);
  }

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
    console.error("Code Exchange Error:", error.message);
    const errorUrl = new URL("/auth/auth-code-error", siteUrl);
    errorUrl.searchParams.set("error_description", "Could not sign you in with the provider.");
    return NextResponse.redirect(errorUrl);
  }

  // Fallback for any other invalid state
  const errorUrl = new URL("/auth/auth-code-error", siteUrl);
  errorUrl.searchParams.set("error_description", "Invalid authentication callback received.");
  return NextResponse.redirect(errorUrl);
}