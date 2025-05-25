import React from "react";
import { SiteSettingsClient } from "./SiteSettingsClient"; // Client component to be created

// TODO: Add admin role check here in the future
// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export default async function SettingsPage() {
  // Future admin check:
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   redirect("/login");
  // }
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("role")
  //   .eq("id", user.id)
  //   .single();
  //
  // if (profile?.role !== 'admin') {
  //    redirect('/'); // Or redirect to an unauthorized page
  // }

  // For now, render the client component directly
  return <SiteSettingsClient />;
}
