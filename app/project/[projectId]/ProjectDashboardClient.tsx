"use client";
import React, { useEffect } from "react";
import type { Project } from "@/lib/types";
import { ManuscriptSection } from "@/components/dashboard/sections/ManuscriptSection";
import { CharactersSection } from "@/components/dashboard/sections/CharactersSection";
import { WorldNotesSection } from "@/components/dashboard/sections/WorldNotesSection";
import { OutlineSection } from "@/components/dashboard/sections/OutlineSection";
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
  useEffect(() => {}, [project, activeSection]);

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
    <div className="flex-1 overflow-y-auto h-full">{renderActiveSection()}</div>
  );
}
