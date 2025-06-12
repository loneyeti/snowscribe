import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // For debugging: Log cookies and user for API requests
  if (request.nextUrl.pathname.startsWith('/api/projects')) {
    // console.log('[Middleware API Check] Path:', request.nextUrl.pathname);
    //const allCookies = request.cookies.getAll();
    // console.log('[Middleware API Check] Incoming Cookies:', JSON.stringify(allCookies, null, 2));
    const { data: { user: apiUser }, error: apiUserError } = await supabase.auth.getUser();
    if (apiUserError) {
      console.error('[Middleware API Check] API User Error:', apiUserError.message);
    }

    // console.log('[Middleware API Check] API User Object:', apiUser ? { id: apiUser.id, email: apiUser.email } : null);

    if (!apiUser && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      console.log(`[Middleware API Check] Redirecting API request for ${request.nextUrl.pathname} to /login`);
      return NextResponse.redirect(url);
    }
    // If apiUser exists or path is /login or /auth, proceed with normal flow for this specific log block
    // The original user check below will still run, this is just for detailed logging of the API path.
  }

  const {
    data: { user },
  } = await supabase.auth.getUser() // This is the general user check

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Add a log before general redirect
    if (!request.nextUrl.pathname.startsWith('/api/')) { // Avoid double logging for API paths handled above
        console.log(`[Middleware General Check] Redirecting ${request.nextUrl.pathname} to /login as user is not authenticated.`);
    }
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
