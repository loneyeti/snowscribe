"use client";
import React from "react";
import { ManuscriptSection } from "@/components/dashboard/sections/ManuscriptSection";
import { CharactersSection } from "@/components/dashboard/sections/CharactersSection";
import { WorldNotesSection } from "@/components/dashboard/sections/WorldNotesSection";
import { OutlineSection } from "@/components/dashboard/sections/OutlineSection";
import { AISection } from "@/components/dashboard/sections/AISection";
import { ExportSection } from "@/components/dashboard/sections/ExportSection";

interface ProjectDashboardClientProps {
  /*
  project: Project & {
    genres: import("@/lib/types").Genre | null;
    wordCount?: number;
  }; */
  activeSection?: string;
}

export function ProjectDashboardClient({
  activeSection = "manuscript",
}: ProjectDashboardClientProps) {
  //useEffect(() => {}, [project, activeSection]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "manuscript":
        return <ManuscriptSection />;
      case "outline":
        return <OutlineSection />;
      case "characters":
        return <CharactersSection />;
      case "world-notes":
        return <WorldNotesSection />;
      case "ai":
        return <AISection />;
      case "export":
        return <ExportSection />;
      default:
        return <ManuscriptSection />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full">{renderActiveSection()}</div>
  );
}
