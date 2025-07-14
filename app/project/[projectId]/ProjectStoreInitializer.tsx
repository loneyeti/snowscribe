// In: app/project/[projectId]/ProjectStoreInitializer.tsx

"use client";

import { useRef, useEffect } from "react";
import { useProjectStore } from "@/lib/stores/projectStore";
// We don't need the Project type here anymore, but let's define the new props
// import type { Project } from "@/lib/types";
import { type User } from "@supabase/supabase-js";
import type { ProjectState } from "@/lib/stores/projectStore"; // 👈 Add this

// Define the shape of the props this component now expects
interface ProjectStoreInitializerProps {
  initialState: Partial<ProjectState>; // 👈 Change this
  user: User;
}

function ProjectStoreInitializer({
  initialState, // 👈 Change this
  user,
}: ProjectStoreInitializerProps) {
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      // We will create this 'initializeAll' function in the next step
      useProjectStore.getState().initializeAll(initialState, user); // 👈 Change this
      initialized.current = true;
    }
    // The dependency array now watches our new props
  }, [initialState, user]);

  return null;
}
export default ProjectStoreInitializer;
