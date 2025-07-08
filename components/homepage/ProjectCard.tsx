"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heading, Paragraph } from "@/components/typography";
import { IconButton } from "@/components/ui/IconButton";
import { Trash2 } from "lucide-react";
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

// Define a type for the project data prop
export interface ProjectData {
  id: string;
  title: string;
  genre?: string;
  wordCount?: number;
  lastUpdated?: string; // Could be a Date object or formatted string
  thumbnailUrl?: string; // Optional image for the card
}

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
  projectData: ProjectData;
  onDelete?: (projectId: string) => void;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ className, projectData, onDelete, ...props }, ref) => {
    const { id, title, genre, wordCount, lastUpdated, thumbnailUrl } =
      projectData;
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          "group relative block cursor-pointer overflow-hidden rounded-lg bg-card text-card-foreground p-6 shadow-md transition-shadow duration-200 hover:bg-accent hover:text-accent-foreground border border-border",
          className
        )}
        {...props}
      >
        {/* Delete Button */}
        {onDelete && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <IconButton
              icon={Trash2}
              variant="ghost"
              size="sm"
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-destructive hover:text-destructive-foreground"
              aria-label={`Delete project ${title}`}
              onClick={(e) => {
                e.preventDefault(); // Prevent Link navigation
                e.stopPropagation(); // Prevent Link navigation
                setIsAlertOpen(true);
              }}
            />
          </div>
        )}

        <Link
          href={`/project/${id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
        >
          {thumbnailUrl && (
            <div className="relative">
              <img
                src={thumbnailUrl}
                alt={`${title} thumbnail`}
                className="rounded-t-xl object-cover h-48 w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-xl" />
            </div>
          )}
          <div className="p-6">
            <Heading level={3} className="mb-2 pr-8">
              {title}
            </Heading>
            {genre && (
              <Paragraph variant="muted" className="mb-1 text-sm">
                {genre}
              </Paragraph>
            )}
            {wordCount !== undefined && (
              <Paragraph variant="small" className="mb-1">
                {wordCount.toLocaleString()} words
              </Paragraph>
            )}
            {lastUpdated && (
              <Paragraph
                variant="small"
                className="text-xs text-muted-foreground"
              >
                Last updated: {lastUpdated}
              </Paragraph>
            )}
          </div>
        </Link>

        {/* Confirmation Dialog */}
        {onDelete && (
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  project {title} and all its associated data (chapters, scenes,
                  characters, etc.).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                    setIsAlertOpen(false);
                  }}
                >
                  Yes, delete project
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
