// app/(dashboard)/project/[projectId]/ProjectDashboardClient.tsx
"use client";

import React, { useEffect } from "react";
import type { Project, Genre } from "@/lib/types";

// Import Section Components
import { ManuscriptSection } from "@/components/dashboard/sections/ManuscriptSection";
import { CharactersSection } from "@/components/dashboard/sections/CharactersSection";
import { WorldNotesSection } from "@/components/dashboard/sections/WorldNotesSection";
import { OutlineSection } from "@/components/dashboard/sections/OutlineSection";

// Import Context Provider
import { ProjectDataProvider } from "@/contexts/ProjectDataContext";

interface ProjectDashboardClientProps {
  project: Project & { genres: Genre | null };
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

      {activeSection === "ai" && (
        <div className="p-4">
          AI Assistant View (Placeholder - To be refactored or implemented as a
          section)
        </div>
      )}
    </ProjectDataProvider>
  );
}
