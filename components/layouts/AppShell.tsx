import React from "react";
import { AppHeader } from "./AppHeader";
import { PrimarySidebar } from "./PrimarySidebar";
import type { Project, Genre } from "@/lib/types"; // Import Project and Genre types

interface AppShellProps {
  children: React.ReactNode;
  project: Project & { genres: Genre | null }; // Add project to props
}

export function AppShell({ children, project }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        projectTitle={project.title}
        projectGenre={project.genres?.name || "N/A"}
        currentWords={project.wordCount || 0}
        targetWords={project.target_word_count || 0}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimarySidebar />
        {/* The 'children' prop will render the ProjectDashboardClient and its content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
        {/* Removed p-4, ProjectDashboardClient or specific views can add their own padding */}
      </div>
    </div>
  );
}
