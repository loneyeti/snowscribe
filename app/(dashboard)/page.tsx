// File: app/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HomePageClient } from "@/components/homepage/HomePageClient";
import type { Project } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, title, genre, updated_at, log_line, target_word_count, created_at, user_id"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const projects: Project[] | null = projectsData as Project[] | null;

  return (
    <HomePageClient
      initialProjects={projects}
      errorOccurred={!!projectsError}
    />
  );
}
