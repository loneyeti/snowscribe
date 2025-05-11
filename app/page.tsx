import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HomePageClientWrapper } from "@/components/homepage"; // Import the wrapper
import type { Project } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // This case should be handled by middleware, but as a fallback:
    redirect("/login");
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select(
      "id, title, genre, updated_at, log_line, target_word_count, created_at, user_id"
    ) // Select all needed fields for Project type
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  // Cast to Project[] type, ensuring all fields are present or handled
  const projects: Project[] | null = projectsData as Project[] | null;

  // const handleLogout = async () => { // Removed as it's unused
  //   "use server";
  //   // For server-side logout, we'll create a dedicated route handler
  //   // This function in a Server Component cannot directly cause a client-side redirect after signout
  //   // without a full page refresh or client-side intervention.
  //   // The UserMenuButton will now link to /auth/logout
  //   const supabase = await createClient();
  //   await supabase.auth.signOut();
  //   redirect("/login"); // This will work if called before rendering, but UserMenuButton is client-side for interaction
  // };

  const projectCount = projects?.length ?? 0;

  return (
    <HomePageClientWrapper
      user={user}
      projects={projects}
      projectCount={projectCount}
      errorOccurred={!!projectsError}
    />
  );
}
