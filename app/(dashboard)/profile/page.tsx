// File: app/(dashboard)/profile/page.tsx
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // This case should be rare if the on-signup trigger works,
    // but it's good practice to handle it.
    redirect("/auth/logout");
  }

  return <ProfileClient profile={profile as Profile} user={user} />;
}
