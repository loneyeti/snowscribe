"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Heading } from "@/components/typography/Heading";
import { HomePageHeaderActions } from "@/components/homepage/HomePageHeaderActions";
import HomePageClientContent from "@/app/HomePageClientContent";
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import type { User } from "@supabase/supabase-js";
import type { Project } from "@/lib/types";
import { deleteProject } from "@/lib/data/projects";
import { toast } from "sonner";

interface HomePageClientWrapperProps {
  user: User | null;
  projects: Project[] | null;
  projectCount: number;
  errorOccurred: boolean;
}

export function HomePageClientWrapper({
  user,
  projects: initialProjects,
  projectCount: initialProjectCount,
  errorOccurred,
}: HomePageClientWrapperProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [displayProjects, setDisplayProjects] = useState<Project[] | null>(
    initialProjects
  );
  const [currentProjectCount, setCurrentProjectCount] =
    useState<number>(initialProjectCount);

  useEffect(() => {
    setDisplayProjects(initialProjects);
    setCurrentProjectCount(initialProjects?.length ?? 0);
  }, [initialProjects]);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleDeleteProject = async (projectId: string) => {
    // Optional: Add a loading state for the specific card or general UI
    try {
      await deleteProject(projectId);
      setDisplayProjects(
        (prevProjects) =>
          prevProjects?.filter((p) => p.id !== projectId) ?? null
      );
      setCurrentProjectCount((prevCount) => prevCount - 1); // Update count
      toast.success("Project deleted successfully.");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete project."
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">Snowscribe</span>
            </Link>
            <HomePageHeaderActions
              user={user}
              onOpenCreateModal={handleOpenCreateModal}
            />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Heading level={1} className="text-3xl sm:text-4xl font-bold mb-2">
              Your Novels
            </Heading>
            <p className="text-muted-foreground">
              You have {currentProjectCount} novel project
              {currentProjectCount === 1 ? "" : "s"}.
            </p>
          </div>
          <HomePageClientContent
            projects={displayProjects}
            errorOccurred={errorOccurred}
            onDeleteProject={handleDeleteProject}
          />
        </main>
      </div>
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onProjectCreated={(newProject) => {
          // Add the new project to the list
          setDisplayProjects((prev) =>
            prev ? [newProject, ...prev] : [newProject]
          );
          setCurrentProjectCount((prev) => prev + 1);
          // router.refresh() is good, but client-side update provides immediate feedback
        }}
      />
    </>
  );
}
