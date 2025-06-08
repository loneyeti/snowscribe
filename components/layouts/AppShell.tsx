"use client"; // AppShell needs to be a client component to manage state

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { PrimarySidebar } from "./PrimarySidebar";
import type { Project, Genre } from "@/lib/types";

interface AppShellInjectedProps {
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
}

interface AppShellProps {
  children: React.ReactNode;
  project: Project & { genres: Genre | null; wordCount?: number };
}

export function AppShell({ children, project }: AppShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "manuscript"; // Default to 'manuscript' if not in URL
  const [currentProjectData, setCurrentProjectData] = useState(project);

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
        />
        <main className="flex-1 overflow-y-auto p-6">
          {" "}
          {/* Added p-6 for some initial padding */}
          {childrenWithProps}
        </main>
      </div>
    </div>
  );
}
