"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { IconButton } from "@/components/ui/IconButton";
import { MoreHorizontal, ArrowRight, Ellipsis } from "lucide-react";
import type { Scene, Chapter } from "@/lib/types";
import { useProjectStore } from "@/lib/stores/projectStore";

interface SceneActionsProps {
  scene: Scene;
  chapters: Chapter[];
}

export function SceneActions({ scene, chapters }: SceneActionsProps) {
  const moveSceneToChapter = useProjectStore(
    (state) => state.moveSceneToChapter
  );

  const otherChapters = chapters.filter((c) => c.id !== scene.chapter_id);

  const handleMove = (destinationChapterId: string) => {
    moveSceneToChapter(scene.id, scene.chapter_id, destinationChapterId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          icon={Ellipsis}
          aria-label={`Actions for ${scene.title}`}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => e.stopPropagation()} // Prevent ListItem's onClick
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Move to Chapter...</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {otherChapters.length > 0 ? (
              otherChapters.map((chapter) => (
                <DropdownMenuItem
                  key={chapter.id}
                  onClick={() => handleMove(chapter.id)}
                >
                  {chapter.title}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No other chapters</DropdownMenuItem>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Future actions like "Delete" or "Duplicate" can be added here */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
