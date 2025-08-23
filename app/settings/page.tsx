// app/settings/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getClientProfile } from "../../lib/data/profiles";
import { getAIVendors } from "../../lib/data/aiVendors";
import { getAIModels } from "../../lib/data/aiModels";
import { getAIPrompts } from "../../lib/data/aiPrompts";
import { getToolModelsWithAIModel } from "../../lib/data/toolModels";
import SettingsStoreInitializer from "./SettingsStoreInitializer";
import { SettingsClientPage } from "./SettingsClientPage";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getClientProfile();
  if (!profile?.is_site_admin) {
    redirect("/");
  }

  const [vendors, models, prompts, toolModels] = await Promise.all([
    getAIVendors(),
    getAIModels(),
    getAIPrompts({ scope: "global" }),
    getToolModelsWithAIModel(),
  ]);

  const initialStoreState = {
    vendors,
    models,
    prompts,
    toolModels,
  };

  return (
    <>
      <SettingsStoreInitializer initialState={initialStoreState} />
      <SettingsClientPage />
    </>
  );
}
