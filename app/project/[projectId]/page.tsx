import { AppShell } from "@/components/layouts/AppShell";
import { ProjectDashboardClient } from "./ProjectDashboardClient";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import { getChaptersWithScenes } from "@/lib/data/chapters"; // 👈 Add this
import { getCharacters } from "@/lib/data/characters"; // 👈 Add this
import { getWorldBuildingNotes } from "@/lib/data/worldBuildingNotes"; // 👈 Add this
import { getSceneTags } from "@/lib/data/sceneTags"; // 👈 Add this
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

  // Use Promise.all to fetch everything at the same time
  const [project, chapters, characters, worldNotes, sceneTags] =
    await Promise.all([
      getProjectById(projectId),
      getChaptersWithScenes(projectId),
      getCharacters(projectId),
      getWorldBuildingNotes(projectId),
      getSceneTags(projectId),
    ]);

  if (!project) {
    notFound();
  }

  // Create a single object with all our initial data
  const initialStoreState = {
    project,
    chapters,
    characters,
    worldNotes,
    sceneTags,
  };

  return (
    <>
      <ProjectStoreInitializer initialState={initialStoreState} user={user} />
      <AppShell project={project} user={user}>
        <ProjectDashboardClient project={project} />
      </AppShell>
    </>
  );
}
