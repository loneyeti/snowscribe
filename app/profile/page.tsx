// app/profile/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientProfile } from "@/lib/data/profiles";
import ProfileStoreInitializer from "./ProfileStoreInitializer";
import { ProfileClientPage } from "./ProfileClientPage";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getClientProfile();
  if (!profile) {
    // This could happen if the profile creation trigger failed.
    // Handle appropriately, e.g., redirect to an error page or onboarding.
    console.error(`Profile not found for user ${user.id}`);
    redirect("/");
  }

  return (
    <>
      <ProfileStoreInitializer initialProfile={profile} />
      <ProfileClientPage />
    </>
  );
}
