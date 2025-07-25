"use client"; // AppShell needs to be a client component to manage state

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { PrimarySidebar } from "./PrimarySidebar";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import type { Project, Genre } from "@/lib/types";
import { User } from "@supabase/supabase-js";

interface AppShellInjectedProps {
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
}

interface AppShellProps {
  children: React.ReactNode;
  project: Project & { genres: Genre | null; wordCount?: number };
  user: User;
}

export function AppShell({ children, project, user }: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "manuscript"; // Default to 'manuscript' if not in URL
  const [currentProjectData, setCurrentProjectData] = useState(project);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setCurrentProjectData(project); // Sync with initial or refreshed server prop
  }, [project]);

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === "settings") {
      router.push("/settings");
    } else {
      const newUrl = `/project/${project.id}?section=${sectionId}`;
      // We use router.push() so the browser back button works as expected.
      router.push(newUrl, { scroll: false });
    }
  };

  const handleProjectUpdate = (
    updatedProject: Project & { genres?: Genre | null }
  ) => {
    setCurrentProjectData((prev) => ({ ...prev, ...updatedProject }));
    router.refresh(); // Refresh server data to ensure consistency everywhere
  };

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement<AppShellInjectedProps>(child)) {
      return React.cloneElement(child, {
        activeSection: activeSection,
        onSectionChange: handleSectionChange,
      });
    }
    return child;
  });

  return (
    <div className="flex h-screen bg-background">
      <PrimarySidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        user={user}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader
          projectTitle={currentProjectData.title}
          projectGenre={currentProjectData.genres?.name || "N/A"}
          currentWords={currentProjectData.wordCount || 0}
          targetWords={currentProjectData.target_word_count || 0}
          projectId={currentProjectData.id}
          initialProjectData={currentProjectData}
          onProjectDetailsUpdated={handleProjectUpdate}
          onEditClick={handleOpenEditModal}
        />
        <main className="flex-1 overflow-y-auto p-6 h-full">
          {childrenWithProps}
        </main>
        {isEditModalOpen && (
          <EditProjectModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            project={currentProjectData}
            onProjectUpdated={(updatedProject) => {
              handleProjectUpdate(updatedProject);
              handleCloseEditModal();
            }}
          />
        )}
      </div>
    </div>
  );
}
