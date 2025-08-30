"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import { Ellipsis, Pencil } from "lucide-react";
import type { Chapter } from "@/lib/types";

interface ChapterActionsProps {
  chapter: Chapter;
  onRename: () => void;
}

export function ChapterActions({ chapter, onRename }: ChapterActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          icon={Ellipsis}
          aria-label={`Actions for ${chapter.title}`}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        {/* Future actions like "Delete Chapter" can be added here */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
