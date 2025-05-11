"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Heading } from "@/components/typography/Heading";
import { HomePageHeaderActions } from "@/components/homepage/HomePageHeaderActions";
import HomePageClientContent from "@/app/HomePageClientContent"; // Adjusted path
import { CreateProjectModal } from "@/components/projects/CreateProjectModal";
import type { User } from "@supabase/supabase-js";
import type { Project } from "@/lib/types";

interface HomePageClientWrapperProps {
  user: User | null;
  projects: Project[] | null;
  projectCount: number;
  errorOccurred: boolean;
}

export function HomePageClientWrapper({
  user,
  projects,
  projectCount,
  errorOccurred,
}: HomePageClientWrapperProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

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
              You have {projectCount} novel project
              {projectCount === 1 ? "" : "s"}.
            </p>
          </div>
          <HomePageClientContent
            projects={projects}
            errorOccurred={errorOccurred}
          />
        </main>
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        // onProjectCreated={(newProject) => {
        //   // Potentially refresh data or navigate, though modal itself calls router.refresh()
        // }}
      />
    </>
  );
}
