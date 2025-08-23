// app/profile/layout.tsx
import { GlobalHeader } from "@/components/layouts/GlobalHeader";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <GlobalHeader user={user} />
      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
