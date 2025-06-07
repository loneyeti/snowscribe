import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Character, SceneTag, Chapter, Scene } from "@/lib/types";
import { getCharacters } from "@/lib/data/characters";
import { toast } from "sonner"; // For error notifications
import { createClient } from "@/lib/supabase/client";

interface ProjectDataContextType {
  allProjectCharacters: Character[];
  allSceneTags: SceneTag[];
  isLoadingAllProjectCharacters: boolean;
  isLoadingAllSceneTags: boolean;
  refreshAllProjectCharacters: () => Promise<void>;
  refreshAllSceneTags: () => Promise<void>;
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
  isLoadingChapters: boolean;
  fetchChapters: () => Promise<void>;
}

const ProjectDataContext = createContext<ProjectDataContextType | undefined>(
  undefined
);

export const ProjectDataProvider: React.FC<{
  projectId: string;
  children: React.ReactNode;
}> = ({ projectId, children }) => {
  const [allProjectCharacters, setAllProjectCharacters] = useState<Character[]>(
    []
  );
  const [isLoadingAllProjectCharacters, setIsLoadingAllProjectCharacters] =
    useState(true);
  const [allSceneTags, setAllSceneTags] = useState<SceneTag[]>([]);
  const [isLoadingAllSceneTags, setIsLoadingAllSceneTags] = useState(true);

  // ADD NEW STATE FOR CHAPTERS
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  const fetchAllProjectCharactersInternal = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingAllProjectCharacters(true);
    try {
      const fetchedCharacters = await getCharacters(projectId);
      setAllProjectCharacters(fetchedCharacters);
    } catch (error) {
      console.error("ProjectDataContext: Failed to fetch characters:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load project characters for context."
      );
    } finally {
      setIsLoadingAllProjectCharacters(false);
    }
  }, [projectId]);

  const fetchAllProjectSceneTagsInternal = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingAllSceneTags(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/scene-tags`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to load scene tags and parse error response.",
        }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const fetchedTags = (await response.json()) as SceneTag[];
      setAllSceneTags(fetchedTags);
    } catch (error) {
      console.error("ProjectDataContext: Failed to fetch scene tags:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load project scene tags for context."
      );
    } finally {
      setIsLoadingAllSceneTags(false);
    }
  }, [projectId]);

  // ADD NEW FETCH FUNCTION FOR CHAPTERS
  const fetchChapters = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingChapters(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/chapters`);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to load chapters." }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const fetchedChapters: Chapter[] = await response.json();
      setChapters(fetchedChapters.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("ProjectDataContext: Failed to fetch chapters:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load chapters."
      );
      setChapters([]);
    } finally {
      setIsLoadingChapters(false);
    }
  }, [projectId]);

  useEffect(() => {
    // Fetch data when projectId changes or on initial mount with a valid projectId
    if (projectId) {
      fetchAllProjectCharactersInternal();
      fetchAllProjectSceneTagsInternal();
      fetchChapters(); // <-- Add this call
    } else {
      // Reset data if projectId becomes invalid (e.g., navigating away from a project)
      setAllProjectCharacters([]);
      setAllSceneTags([]);
      setChapters([]); // <-- Add this reset
      setIsLoadingAllProjectCharacters(false);
      setIsLoadingAllSceneTags(false);
      setIsLoadingChapters(false); // <-- Add this reset
    }
  }, [
    projectId,
    fetchAllProjectCharactersInternal,
    fetchAllProjectSceneTagsInternal,
    fetchChapters, // <-- Add dependency
  ]);

  // REAL-TIME SUBSCRIPTION WITH IMPROVED ERROR HANDLING
  useEffect(() => {
    if (!projectId || typeof projectId !== "string") {
      console.warn("Invalid projectId for real-time subscription:", projectId);
      return;
    }

    let scenesUpdateChannel: ReturnType<
      ReturnType<typeof createClient>["channel"]
    > | null = null;
    let isMounted = true;

    const setupChannel = async () => {
      try {
        const supabase = createClient();
        scenesUpdateChannel = supabase
          .channel(`project-${projectId}-scenes-update`, {
            config: {
              presence: { key: `project-${projectId}` },
              broadcast: { ack: true },
            },
          })
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "scenes",
            },
            (payload) => {
              if (!isMounted) return;
              console.log("Real-time scene update received:", payload);
              const updatedScene = payload.new as Scene;

              const chapterExists = chapters.some(
                (c) => c.id === updatedScene.chapter_id
              );
              if (!chapterExists) {
                console.log(
                  "Change detected in a chapter not currently loaded. Refetching all chapters."
                );
                fetchChapters();
                return;
              }

              setChapters((prevChapters) => {
                return prevChapters.map((chapter) => {
                  if (chapter.id === updatedScene.chapter_id) {
                    const sceneExists = chapter.scenes?.some(
                      (s) => s.id === updatedScene.id
                    );
                    if (!sceneExists) {
                      const newScenes = [
                        ...(chapter.scenes || []),
                        updatedScene,
                      ].sort((a, b) => a.order - b.order);
                      return { ...chapter, scenes: newScenes };
                    }

                    const updatedScenes = chapter.scenes?.map((scene) =>
                      scene.id === updatedScene.id
                        ? { ...scene, ...updatedScene }
                        : scene
                    );
                    return { ...chapter, scenes: updatedScenes };
                  }
                  return chapter;
                });
              });
              toast.info(
                `Scene "${updatedScene.title || "Untitled"}" was updated.`
              );
            }
          );

        let subscriptionSuccessful = false;

        await scenesUpdateChannel.subscribe((status: string, err?: Error) => {
          if (!isMounted) return;

          if (status === "SUBSCRIBED") {
            subscriptionSuccessful = true;
            console.log(
              `Successfully subscribed to scene updates for project ${projectId}`
            );
          }
          if (status === "CHANNEL_ERROR") {
            console.error("Real-time channel error:", {
              status,
              error: err,
              projectId,
              timestamp: new Date().toISOString(),
            });
            toast.error(
              "Real-time connection failed. Updates may not appear automatically."
            );
          }
        });

        if (!subscriptionSuccessful) {
          throw new Error("Failed to subscribe to channel");
        }
      } catch (error) {
        console.error("Error setting up real-time channel:", {
          error,
          projectId,
          timestamp: new Date().toISOString(),
        });
        toast.error(
          "Failed to establish real-time connection. Please refresh the page."
        );
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      if (scenesUpdateChannel) {
        scenesUpdateChannel.unsubscribe().catch((err: Error) => {
          console.error("Error unsubscribing from channel:", err);
        });
      }
    };
  }, [projectId, chapters, fetchChapters]);

  const value = {
    allProjectCharacters,
    allSceneTags,
    isLoadingAllProjectCharacters,
    isLoadingAllSceneTags,
    refreshAllProjectCharacters: fetchAllProjectCharactersInternal,
    refreshAllSceneTags: fetchAllProjectSceneTagsInternal,
    // ADD THESE NEW EXPORTS
    chapters,
    setChapters, // Useful for optimistic updates
    isLoadingChapters,
    fetchChapters,
  };

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
};

export const useProjectData = () => {
  const context = useContext(ProjectDataContext);
  if (context === undefined) {
    throw new Error("useProjectData must be used within a ProjectDataProvider");
  }
  return context;
};
