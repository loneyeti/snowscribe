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
    // Actions to take when the entire project context changes.
    // Most resets are now handled by hooks re-initializing or sections based on `isActive`.
    console.log(`[ProjectDashboardClient] Project changed to: ${project.id}`);
  }, [project]);

  return (
    <ProjectDataProvider projectId={project.id}>
      <ManuscriptSection
        project={project}
        isActive={activeSection === "manuscript"}
      />
      <OutlineSection
        project={project}
        isActive={activeSection === "outline"}
      />
      <CharactersSection
        project={project}
        isActive={activeSection === "characters"}
      />
      <WorldNotesSection
        project={project}
        isActive={activeSection === "world-notes"}
      />

      {/* Render AISection when activeSection is "ai" */}
      <AISection project={project} isActive={activeSection === "ai"} />
      <ExportSection project={project} isActive={activeSection === "export"} />
    </ProjectDataProvider>
  );
}
