// components/layouts/AppHeader.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { cactusSerif } from "@/lib/fonts";
import { IconButton } from "@/components/ui/IconButton";
import { CreditsBadge } from "@/components/ui/CreditsBadge";
import { WordCountProgressIndicator } from "@/components/ui/WordCountProgressIndicator";
import type { Project, Genre } from "@/lib/types";
import { Pencil } from "lucide-react";

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
  onEditClick: () => void;
}

export function AppHeader({
  projectTitle,
  projectGenre,
  currentWords,
  targetWords,
  onEditClick,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full p-2",
        "border-b border-border/60",
        "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
      role="banner"
    >
      {/* Top row */}
      <div className="mx-auto flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Title + genre */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1
              className={cn(
                cactusSerif.className,
                "min-w-0 truncate",
                "text-xl font-semibold tracking-tight sm:text-2xl"
              )}
              title={projectTitle}
            >
              {projectTitle}
            </h1>

            <IconButton
              icon={Pencil}
              aria-label="Edit project details"
              onClick={onEditClick}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            />
          </div>

          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground sm:text-sm">
            {projectGenre}
          </p>
        </div>

        {/* Desktop utilities */}
        <div className="hidden items-center gap-4 sm:flex">
          <CreditsBadge className="shrink-0 mr-4" />
          <div className="w-48 lg:w-56">
            <WordCountProgressIndicator
              currentWords={currentWords}
              targetWords={targetWords}
            />
          </div>
        </div>
      </div>

      {/* Mobile utilities row */}
      <div className="sm:hidden px-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CreditsBadge />
          <div className="w-40">
            <WordCountProgressIndicator
              currentWords={currentWords}
              targetWords={targetWords}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
