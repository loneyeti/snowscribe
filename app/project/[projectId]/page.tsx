import { AppShell } from "@/components/layouts/AppShell";
import { ProjectDashboardClient } from "./ProjectDashboardClient";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import type { Project, Genre, Scene, Chapter } from "@/lib/types";
import ProjectStoreInitializer from "./ProjectStoreInitializer";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export type { Project, Chapter, Genre, Scene };

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectStoreInitializer project={project} user={user} />{" "}
      <AppShell project={project} user={user}>
        <ProjectDashboardClient project={project} />
      </AppShell>
    </>
  );
}
