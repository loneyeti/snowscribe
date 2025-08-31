"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowRight, Ellipsis, Trash2 } from "lucide-react";
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
  const deleteScene = useProjectStore((state) => state.deleteScene);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const otherChapters = chapters.filter((c) => c.id !== scene.chapter_id);

  const handleMove = (destinationChapterId: string) => {
    moveSceneToChapter(scene.id, scene.chapter_id, destinationChapterId);
  };

  const handleDelete = () => {
    deleteScene(scene.chapter_id, scene.id);
    setIsDeleteDialogOpen(false); // Dialog will close automatically on action
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            icon={Ellipsis}
            aria-label={`Actions for ${scene.title || "scene"}`}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              scene &quot;{scene.title || "Untitled Scene"}&quot; and all of its
              content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-red-foreground hover:bg-red-700"
            >
              Delete Scene
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
