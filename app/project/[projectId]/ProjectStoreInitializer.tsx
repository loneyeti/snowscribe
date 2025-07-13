"use client";
import { useRef, useEffect } from "react";
import { useProjectStore } from "@/lib/stores/projectStore";
import type { Project } from "@/lib/types";
import { type User } from "@supabase/supabase-js";

interface ProjectStoreInitializerProps {
  project: Project;
  user: User;
}

function ProjectStoreInitializer({
  project,
  user,
}: ProjectStoreInitializerProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      useProjectStore.getState().initialize(project, user);
      initialized.current = true;
    }
  }, [project, user]);

  return null;
}

export default ProjectStoreInitializer;
