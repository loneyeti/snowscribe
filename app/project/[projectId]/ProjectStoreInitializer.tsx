"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/lib/stores/projectStore";
import { type User } from "@supabase/supabase-js";
import type { ProjectState } from "@/lib/stores/projectStore";

interface ProjectStoreInitializerProps {
  initialState: Partial<ProjectState>;
  user: User;
}

function ProjectStoreInitializer({
  initialState,
  user,
}: ProjectStoreInitializerProps) {
  // This useEffect hook now correctly handles both setting up and cleaning up the store.
  useEffect(() => {
    // This function runs every time a user navigates to a new project page
    // because the 'initialState' prop will be different.
    useProjectStore.getState().initializeAll(initialState, user);

    // This is the cleanup function. It runs when the component is "unmounted",
    // which happens when the user navigates away from the project page entirely
    // (e.g., back to the main menu). This ensures the store is clean for the next session.
    return () => {
      useProjectStore.getState().resetProjectState();
    };
  }, [initialState, user]); // The effect re-runs if the project data or user changes.

  // This component renders nothing to the screen.
  return null;
}

export default ProjectStoreInitializer;
