"use client"; // AppShell needs to be a client component to manage state

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
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
  const router = useRouter(); // Initialize useRouter

  const handleSectionChange = (sectionId: string) => {
    if (sectionId === "settings") {
      router.push("/settings");
    } else {
      setActiveSection(sectionId);
    }
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
          projectTitle={project.title}
          projectGenre={project.genres?.name || "N/A"}
          currentWords={project.wordCount || 0}
          targetWords={project.target_word_count || 0}
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
