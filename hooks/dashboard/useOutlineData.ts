// hooks/dashboard/useOutlineData.ts
import { useState, useCallback, useEffect } from 'react';
import type { Project, Scene, Chapter, UpdateSceneValues } from '@/lib/types';
import { toast } from 'sonner';
import { updateProjectSchema, UpdateProjectValues } from '@/lib/schemas/project.schema';
import { updateScene, updateSceneCharacters, updateSceneTags } from '@/lib/data/scenes';
import { updateProject } from '@/lib/data/projects';
import { useProjectData } from '@/contexts/ProjectDataContext';
import { getChaptersWithScenes } from '@/lib/services/chapterService';

export function useOutlineData(initialProject: Project, projectId: string) {
  const [currentProjectDetails, setCurrentProjectDetails] = useState(initialProject);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sceneUpdateKey } = useProjectData();

  const fetchChaptersWithScenes = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedChapters = await getChaptersWithScenes(projectId, initialProject.user_id);
      setChapters(fetchedChapters);
    } catch (error) {
      toast.error('Failed to load outline data.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchChaptersWithScenes();
  }, [sceneUpdateKey, fetchChaptersWithScenes]);

  useEffect(() => {
    setCurrentProjectDetails(initialProject);
  }, [initialProject]);

  const handleSynopsisUpdate = useCallback(async (updatedSynopsisData: Pick<Project, "log_line" | "one_page_synopsis">) => {
    const payload: UpdateProjectValues = {
        log_line: updatedSynopsisData.log_line,
        one_page_synopsis: updatedSynopsisData.one_page_synopsis,
    };
    const validationResult = updateProjectSchema.pick({ log_line: true, one_page_synopsis: true }).safeParse(payload);
    if (!validationResult.success) {
        toast.error("Invalid synopsis data.");
        console.error("Synopsis validation error:", validationResult.error);
        return null;
    }

    try {
        const updatedProjectFromServer = await updateProject(projectId, validationResult.data);
        setCurrentProjectDetails(prev => ({...prev, ...updatedProjectFromServer}));
        toast.success("Synopsis updated successfully.");
        return updatedProjectFromServer;
    } catch (error) {
        console.error("useOutlineData: Failed to update synopsis:", error);
        toast.error(error instanceof Error ? error.message : "Could not save synopsis.");
        return null;
    }
  }, [projectId]);


  const handleSceneOutlineUpdate = useCallback(async (
    chapterId: string,
    sceneId: string,
    updatedData: Partial<Scene>
  ): Promise<Scene | null> => {
    try {
      const payload: UpdateSceneValues = {
        outline_description: updatedData.outline_description,
        pov_character_id: updatedData.pov_character_id,
        primary_category: updatedData.primary_category
      };
      
      // Handle character and tag updates separately through junction tables
      if (updatedData.scene_characters) {
        const characterIds = updatedData.scene_characters.map(c => c.character_id);
        await updateSceneCharacters(projectId, sceneId, characterIds);
      }
      
      if (updatedData.scene_applied_tags) {
        const tagIds = updatedData.scene_applied_tags.map(t => t.tag_id);
        await updateSceneTags(projectId, sceneId, tagIds);
      }

      const updatedSceneFromAPI = await updateScene(projectId, chapterId, sceneId, payload);
      toast.success("Scene details saved successfully.");
      return updatedSceneFromAPI;
    } catch (error) {
      console.error("useOutlineData: Failed to save scene outline details:", error);
      toast.error(error instanceof Error ? error.message : "Could not save scene outline details.");
      return null;
    }
  }, [projectId]);


  return {
    project: currentProjectDetails,
    chapters,
    isLoading,
    handleSynopsisUpdate,
    handleSceneOutlineUpdate,
    refetchChapters: fetchChaptersWithScenes,
  };
}
