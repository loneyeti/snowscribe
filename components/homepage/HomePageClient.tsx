// File: components/homepage/HomePageClient.tsx
"use client";

import React, { useState, useEffect } from "react";
//import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heading } from "@/components/typography/Heading";
import HomePageClientContent from "@/app/HomePageClientContent";
import type { Project } from "@/lib/types";
import { deleteProject } from "@/lib/data/projects";

interface HomePageClientProps {
  initialProjects: Project[] | null;
  errorOccurred: boolean;
}

export function HomePageClient({
  initialProjects,
  errorOccurred,
}: HomePageClientProps) {
  //const router = useRouter();
  const [displayProjects, setDisplayProjects] = useState<Project[] | null>(
    initialProjects
  );

  useEffect(() => {
    setDisplayProjects(initialProjects);
  }, [initialProjects]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setDisplayProjects(
        (prevProjects) =>
          prevProjects?.filter((p) => p.id !== projectId) ?? null
      );
      toast.success("Project deleted successfully.");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete project."
      );
    }
  };

  const projectCount = displayProjects?.length ?? 0;

  return (
    <>
      <div className="mb-8">
        <Heading level={1} className="text-3xl sm:text-4xl font-bold mb-2">
          Your Novels
        </Heading>
        <p className="text-muted-foreground">
          You have {projectCount} novel project{projectCount === 1 ? "" : "s"}.
        </p>
      </div>
      <HomePageClientContent
        projects={displayProjects}
        errorOccurred={errorOccurred}
        onDeleteProject={handleDeleteProject}
      />
    </>
  );
}
