"use client"; // May need client-side interactions or access to context for project data

import React from "react";
import { WordCountProgressIndicator } from "@/components/ui/WordCountProgressIndicator";

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
    <header className="p-4 border-b bg-background text-foreground flex items-center justify-between w-full">
      {/* Left side: Project Title and Genre */}
      <div>
        <h1 className="text-2xl font-bold">{projectTitle}</h1>
        <p className="text-sm text-muted-foreground">{projectGenre}</p>
      </div>

      {/* Right side: Word Count Progress Indicator */}
      <div className="w-1/4">
        {" "}
        {/* Adjust width as needed */}
        <WordCountProgressIndicator
          currentWords={currentWords}
          targetWords={targetWords}
        />
      </div>
    </header>
  );
}
