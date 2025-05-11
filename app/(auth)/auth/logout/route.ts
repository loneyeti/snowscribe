import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check if the user is currently authenticated.
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // Redirect to the login page after logout.
  // Ensure the redirect URL is absolute for server-side redirects.
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = ''; // Clear any query params

  return NextResponse.redirect(redirectUrl);
}
