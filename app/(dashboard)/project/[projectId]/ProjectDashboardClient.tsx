// app/(dashboard)/project/[projectId]/ProjectDashboardClient.tsx
"use client";

import React, { useEffect } from "react";
import type { Project } from "@/lib/types";

// Import Section Components
import { ManuscriptSection } from "@/components/dashboard/sections/ManuscriptSection";
import { CharactersSection } from "@/components/dashboard/sections/CharactersSection";
import { WorldNotesSection } from "@/components/dashboard/sections/WorldNotesSection";
import { OutlineSection } from "@/components/dashboard/sections/OutlineSection";

// Import Context Provider
import { ProjectDataProvider } from "@/contexts/ProjectDataContext";
import { AISection } from "@/components/dashboard/sections/AISection";
import { ExportSection } from "@/components/dashboard/sections/ExportSection";

interface ProjectDashboardClientProps {
  project: Project & {
    genres: import("@/lib/types").Genre | null;
    wordCount?: number;
  };
  activeSection?: string;
}

export function ProjectDashboardClient({
  project,
  activeSection = "manuscript",
}: ProjectDashboardClientProps) {
  useEffect(() => {
    // Project and active section tracking removed
  }, [project, activeSection]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "manuscript":
        return <ManuscriptSection project={project} />;
      case "outline":
        return <OutlineSection project={project} />;
      case "characters":
        return <CharactersSection project={project} />;
      case "world-notes":
        return <WorldNotesSection project={project} />;
      case "ai":
        return <AISection project={project} />;
      case "export":
        return <ExportSection project={project} />;
      default:
        return <ManuscriptSection project={project} />;
    }
  };

  return (
    <ProjectDataProvider projectId={project.id}>
      <div className="flex-1 overflow-y-auto h-full">
        {renderActiveSection()}
      </div>
    </ProjectDataProvider>
  );
}
