"use client";

import React, { useState } from "react";
import { WordCountProgressIndicator } from "@/components/ui/WordCountProgressIndicator";
import { UserMenuButton } from "@/components/auth/UserMenuButton";
import { cactusSerif } from "@/lib/fonts";
import { Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import { cn } from "@/lib/utils";
import type { Project, Genre } from "@/lib/types";

interface AppHeaderProps {
  projectTitle: string;
  projectGenre: string;
  currentWords: number;
  targetWords: number;
  projectId: string;
  initialProjectData: Project & { genres?: Genre | null };
  onProjectDetailsUpdated: (
    updatedProject: Project & { genres?: Genre | null }
  ) => void;
}

export function AppHeader({
  projectTitle,
  projectGenre,
  currentWords,
  targetWords,
  initialProjectData,
  onProjectDetailsUpdated,
}: AppHeaderProps) {
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const handleOpenEditProjectModal = () => setIsEditProjectModalOpen(true);
  const handleCloseEditProjectModal = () => setIsEditProjectModalOpen(false);

  return (
    <header
      className={cn(
        "relative px-6 py-5 w-full",
        "bg-white/90 dark:bg-slate-900/95 backdrop-blur-md",
        "border-b border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg shadow-slate-200/20 dark:shadow-slate-900/30",
        "transition-all duration-300 ease-out",
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-slate-300/60 after:to-transparent",
        "dark:after:via-slate-600/40"
      )}
    >
      <div className="flex items-center justify-between max-w-full">
        {/* Left side: Project Title and Genre */}
        <div className="flex-1 min-w-0 mr-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <h1
                className={cn(
                  "text-2xl md:text-3xl font-bold tracking-tight truncate",
                  "text-slate-900 dark:text-slate-100",
                  "relative inline-block",
                  cactusSerif.className
                )}
              >
                <span className="relative">
                  {projectTitle}
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-primary/70 to-primary/40 dark:from-primary/30 dark:via-primary/50 dark:to-primary/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </span>
              </h1>
            </div>
            <IconButton
              icon={Pencil}
              aria-label="Edit Project Details"
              onClick={handleOpenEditProjectModal}
              variant="ghost"
              size="sm"
              className={cn(
                "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                "transition-all duration-200 ease-out",
                "hover:scale-105 active:scale-95",
                "backdrop-blur-sm border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
              )}
            />
          </div>
          <p
            className={cn(
              "text-sm text-slate-500/90 dark:text-slate-400/90",
              "font-medium tracking-wide truncate",
              "transition-colors duration-200"
            )}
          >
            {projectGenre}
          </p>
        </div>

        {/* Right side: Word Count Progress Indicator and User Menu */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="hidden sm:block w-48 lg:w-56">
            <WordCountProgressIndicator
              currentWords={currentWords}
              targetWords={targetWords}
            />
          </div>
          <div
            className={cn(
              "relative",
              "after:absolute after:-left-3 after:top-1/2 after:-translate-y-1/2",
              "after:w-px after:h-8 after:bg-slate-200/60 dark:after:bg-slate-700/60",
              "hidden sm:after:block"
            )}
          >
            <UserMenuButton
              className={cn(
                "transition-all duration-200 ease-out",
                "hover:scale-105 active:scale-95"
              )}
            />
          </div>
        </div>
      </div>

      {/* Mobile word count - shown on small screens */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-700/40">
        <WordCountProgressIndicator
          currentWords={currentWords}
          targetWords={targetWords}
        />
      </div>

      {isEditProjectModalOpen && initialProjectData && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={handleCloseEditProjectModal}
          project={initialProjectData}
          onProjectUpdated={(updatedProjectData) => {
            onProjectDetailsUpdated(updatedProjectData);
            handleCloseEditProjectModal();
          }}
        />
      )}
    </header>
  );
}
