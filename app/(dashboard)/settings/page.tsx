import React from "react";
import { SiteSettingsClient } from "./SiteSettingsClient";
import { createClient } from "@/lib/supabase/server";
import { isSiteAdmin } from "@/lib/supabase/guards";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const isAdmin = await isSiteAdmin(supabase);

  if (!isAdmin) {
    // Redirect non-admins to the homepage
    redirect("/");
  }

  // Only render the settings page if the user is an admin
  return <SiteSettingsClient />;
}
