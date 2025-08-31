"use client";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import type { Chapter } from "@/lib/types";
import { useProjectStore } from "@/lib/stores/projectStore";

interface ChapterActionsProps {
  chapter: Chapter;
  onRename: () => void;
}

export function ChapterActions({ chapter, onRename }: ChapterActionsProps) {
  const deleteChapter = useProjectStore((state) => state.deleteChapter);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const sceneCount = chapter.scenes?.length || 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteChapter(chapter.id);
  };

  return (
    <>
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
              chapter &quot;{chapter.title}&quot;.
              {sceneCount > 0 && (
                <strong className="mt-2 block font-semibold text-destructive">
                  This chapter contains {sceneCount} scene
                  {sceneCount > 1 ? "s" : ""}, which will also be permanently
                  deleted.
                </strong>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-red-foreground hover:bg-red-700"
            >
              Delete Chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
