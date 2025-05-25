"use client"; // May need client-side interactions or access to context for project data

import React, { useState } from "react";
import { WordCountProgressIndicator } from "@/components/ui/WordCountProgressIndicator";
import { UserMenuButton } from "@/components/auth/UserMenuButton";
import { cactusSerif } from "@/lib/fonts";
import { Pencil } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import type { Project, Genre } from "@/lib/types";

interface AppHeaderProps {
  projectTitle: string;
  projectGenre: string;
  currentWords: number; // Prop for WordCountProgressIndicator
  targetWords: number; // Prop for WordCountProgressIndicator
  projectId: string;
  initialProjectData: Project & { genres?: Genre | null }; // Pass the whole project object
  onProjectDetailsUpdated: (
    updatedProject: Project & { genres?: Genre | null }
  ) => void;
}

export function AppHeader({
  projectTitle,
  projectGenre,
  currentWords,
  targetWords,
  projectId,
  initialProjectData,
  onProjectDetailsUpdated,
}: AppHeaderProps) {
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);

  const handleOpenEditProjectModal = () => setIsEditProjectModalOpen(true);
  const handleCloseEditProjectModal = () => setIsEditProjectModalOpen(false);

  return (
    <header className="p-4 bg-background text-foreground flex items-center justify-between w-full shadow-sm">
      {/* Left side: Project Title and Genre */}
      <div>
        <div className="flex items-center">
          {" "}
          {/* Wrapper for title and button */}
          <h1
            className={`text-2xl font-bold ${cactusSerif.className} pb-2 mr-2`}
          >
            {projectTitle}
          </h1>
          <IconButton
            icon={Pencil}
            aria-label="Edit Project Details"
            onClick={handleOpenEditProjectModal}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        <p className="text-sm text-gray-500">{projectGenre}</p>
      </div>

      {/* Right side: Word Count Progress Indicator and User Menu */}
      <div className="flex items-center space-x-4">
        <div className="w-48">
          {" "}
          {/* Adjusted width for WordCountProgressIndicator */}
          <WordCountProgressIndicator
            currentWords={currentWords}
            targetWords={targetWords}
          />
        </div>
        <UserMenuButton />
      </div>

      {isEditProjectModalOpen && initialProjectData && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={handleCloseEditProjectModal}
          project={initialProjectData}
          onProjectUpdated={(updatedProjectData) => {
            onProjectDetailsUpdated(updatedProjectData); // Call the prop passed from AppShell
            handleCloseEditProjectModal();
          }}
        />
      )}
    </header>
  );
}
