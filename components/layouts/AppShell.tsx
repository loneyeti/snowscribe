"use client"; // AppShell needs to be a client component to manage state

import React, { useState } from "react";
import { AppHeader } from "./AppHeader";
import { PrimarySidebar } from "./PrimarySidebar";
import type { Project, Genre } from "@/lib/types";

interface AppShellInjectedProps {
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
}

interface AppShellProps {
  children: React.ReactNode;
  project: Project & { genres: Genre | null };
}

export function AppShell({ children, project }: AppShellProps) {
  const [activeSection, setActiveSection] = useState<string>("manuscript");

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
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
    <div className="flex flex-col h-screen bg-background">
      <AppHeader
        projectTitle={project.title}
        projectGenre={project.genres?.name || "N/A"}
        currentWords={project.wordCount || 0}
        targetWords={project.target_word_count || 0}
      />
      <div className="flex flex-1 overflow-hidden">
        <PrimarySidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <main className="flex-1 overflow-y-auto">{childrenWithProps}</main>
      </div>
    </div>
  );
}
