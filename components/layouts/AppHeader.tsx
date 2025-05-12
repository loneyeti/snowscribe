"use client"; // May need client-side interactions or access to context for project data

import React from "react";
import { WordCountProgressIndicator } from "@/components/ui/WordCountProgressIndicator";
import { UserMenuButton } from "@/components/auth/UserMenuButton";
import { cactusSerif } from "@/lib/fonts";

interface AppHeaderProps {
  projectTitle: string;
  projectGenre: string;
  currentWords: number; // Prop for WordCountProgressIndicator
  targetWords: number; // Prop for WordCountProgressIndicator
}

export function AppHeader({
  projectTitle,
  projectGenre,
  currentWords,
  targetWords,
}: AppHeaderProps) {
  return (
    <header className="p-4 bg-background text-foreground flex items-center justify-between w-full shadow-sm">
      {/* Left side: Project Title and Genre */}
      <div>
        <h1 className={`text-2xl font-bold ${cactusSerif.className} pb-2`}>
          {projectTitle}
        </h1>
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
    </header>
  );
}
