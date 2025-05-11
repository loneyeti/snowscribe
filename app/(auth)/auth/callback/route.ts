import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { type EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  // Handle email confirmation (OTP)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // OTP verification successful, user is now authenticated.
      // Redirect to the 'next' URL or root.
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OTP Verification Error:", error.message);
    // Fall through to auth-code-error if OTP verification fails
  }
  // Handle OAuth code exchange
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // OAuth code exchange successful.
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code Exchange Error:", error.message);
    // Fall through to auth-code-error if code exchange fails
  }

  // If neither OTP nor code flow was successful or applicable, redirect to an error page.
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
