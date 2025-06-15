import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  console.log('Using Client Auth:')
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} `)
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
