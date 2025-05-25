import * as React from "react";
import { cn } from "@/lib/utils";
import { ProjectCard, type ProjectData } from "./ProjectCard";

export interface ProjectListProps extends React.HTMLAttributes<HTMLDivElement> {
  projects: ProjectData[];
  listLayout?: "grid" | "list";
  onDeleteProject?: (projectId: string) => void;
}

const ProjectList = React.forwardRef<HTMLDivElement, ProjectListProps>(
  (
    { className, projects, listLayout = "grid", onDeleteProject, ...props },
    ref
  ) => {
    if (!projects || projects.length === 0) {
      return (
        <div
          ref={ref}
          className={cn("text-center py-10", className)}
          {...props}
        >
          <p className="text-muted-foreground">No projects found.</p>
        </div>
      );
    }

    const layoutClasses =
      listLayout === "grid"
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        : "space-y-4";

    return (
      <div ref={ref} className={cn(layoutClasses, className)} {...props}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            projectData={project}
            onDelete={onDeleteProject}
          />
        ))}
      </div>
    );
  }
);
ProjectList.displayName = "ProjectList";

export { ProjectList };
