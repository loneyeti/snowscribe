// File: app/(dashboard)/layout.tsx
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { GlobalHeader } from "@/components/layouts/GlobalHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalHeader user={user} />
      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
