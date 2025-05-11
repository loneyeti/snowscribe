import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heading, Paragraph } from "@/components/typography"; // Assuming typography components are exported from here

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
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
  ({ className, projectData, ...props }, ref) => {
    const { id, title, genre, wordCount, lastUpdated, thumbnailUrl } =
      projectData;

    return (
      <Link href={`/project/${id}`} passHref legacyBehavior>
        <div
          ref={ref}
          className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer",
            className
          )}
          {...props}
        >
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={`${title} thumbnail`}
              className="rounded-t-lg object-cover h-48 w-full" // Example styling
            />
          )}
          <div className="p-6">
            <Heading level={3} className="mb-2">
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
        </div>
      </Link>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

export { ProjectCard };
