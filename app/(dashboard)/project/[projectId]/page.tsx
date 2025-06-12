import { AppShell } from "@/components/layouts/AppShell";
import { ProjectDashboardClient } from "./ProjectDashboardClient";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server"; // For user check
import { getProjectById } from "@/lib/data/projects";
// import { getChaptersByProjectId } from "@/lib/data/chapters"; // Chapters fetched in Client component
import type { Project, Genre, Scene, Chapter } from "@/lib/types"; // Chapter still needed for re-export

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

// Re-exporting types for potential use by client components or other server components in this route group
export type { Project, Chapter, Genre, Scene };

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[ProjectPage] No user found by page, redirecting to /login.");
    redirect("/login");
  }
  console.log(
    "[ProjectPage] User authenticated by page:",
    user ? { id: user.id, email: user.email } : null
  );

  const { projectId } = await params; // Await params
  console.log(
    `[ProjectPage] Attempting to fetch project with ID: ${projectId}`
  );
  const project = await getProjectById(projectId); // Use awaited projectId

  if (!project) {
    console.log(
      `[ProjectPage] getProjectById returned null for projectId: ${projectId}. Calling notFound().`
    );
    // getProjectById will log the error if it's not a 404
    notFound();
  }

  // Ensure the fetched project belongs to the authenticated user.
  // The API /api/projects/[projectId] already performs this check,
  // so an additional check here is redundant if API is the sole source.
  // However, if getProjectById were to fetch directly from DB, this would be crucial.
  // For now, relying on the API's auth check.

  // const initialChapters = await getChaptersByProjectId(params.projectId); // Chapters are now fetched in ProjectDashboardClient

  return (
    <AppShell project={project}>
      <ProjectDashboardClient project={project} />
    </AppShell>
  );
}
