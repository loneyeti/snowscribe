import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Character, SceneTag } from "@/lib/types";
import { getCharacters } from "@/lib/data/characters";
import { getSceneTags } from "@/lib/data/sceneTags";
import { toast } from "sonner";

interface ProjectDataContextType {
  allProjectCharacters: Character[];
  allSceneTags: SceneTag[];
  isLoadingAllProjectCharacters: boolean;
  isLoadingAllSceneTags: boolean;
  refreshAllProjectCharacters: () => Promise<void>;
  refreshAllSceneTags: () => Promise<void>;
  sceneUpdateKey: number;
  triggerSceneUpdate: () => void;
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
  const [sceneUpdateKey, setSceneUpdateKey] = useState(0);

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
      const fetchedTags = await getSceneTags(projectId);
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

  useEffect(() => {
    // Fetch data when projectId changes or on initial mount with a valid projectId
    if (projectId) {
      fetchAllProjectCharactersInternal();
      fetchAllProjectSceneTagsInternal();
    } else {
      // Reset data if projectId becomes invalid (e.g., navigating away from a project)
      setAllProjectCharacters([]);
      setAllSceneTags([]);
      setIsLoadingAllProjectCharacters(false);
      setIsLoadingAllSceneTags(false);
    }
  }, [
    projectId,
    fetchAllProjectCharactersInternal,
    fetchAllProjectSceneTagsInternal,
  ]);

  const triggerSceneUpdate = useCallback(() => {
    setSceneUpdateKey((prevKey) => prevKey + 1);
  }, []);

  const value = {
    allProjectCharacters,
    allSceneTags,
    isLoadingAllProjectCharacters,
    isLoadingAllSceneTags,
    refreshAllProjectCharacters: fetchAllProjectCharactersInternal,
    refreshAllSceneTags: fetchAllProjectSceneTagsInternal,
    sceneUpdateKey,
    triggerSceneUpdate,
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
