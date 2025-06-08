// hooks/dashboard/useOutlineData.ts
import { useState, useCallback, useEffect } from 'react';
import type { Project, Scene, Chapter, UpdateSceneValues } from '@/lib/types';
import { toast } from 'sonner';
import { updateProjectSchema, UpdateProjectValues } from '@/lib/schemas/project.schema';
import { updateScene } from '@/lib/data/scenes';
import { useProjectData } from '@/contexts/ProjectDataContext';
import { getChaptersByProjectId } from '@/lib/data/chapters';

export function useOutlineData(initialProject: Project, projectId: string) {
  const [currentProjectDetails, setCurrentProjectDetails] = useState(initialProject);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sceneUpdateKey } = useProjectData();

  const fetchChaptersWithScenes = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedChapters = await getChaptersByProjectId(projectId);
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
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validationResult.data),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to save synopsis.");
        }
        const updatedProjectFromServer: Project = await response.json();
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
      const payload: UpdateSceneValues = {};
      if (updatedData.outline_description !== undefined) payload.outline_description = updatedData.outline_description;
      if (updatedData.pov_character_id !== undefined) payload.pov_character_id = updatedData.pov_character_id;
      if (updatedData.primary_category !== undefined) payload.primary_category = updatedData.primary_category;

      if (Object.keys(payload).length === 0) {
        // If only tag_ids or other_character_ids changed, this payload might be empty.
        // The component ChapterSceneOutlineList will call specific handlers for those.
      }

      const updatedSceneFromAPI = await updateScene(projectId, chapterId, sceneId, payload);
      toast.success("Scene outline details saved.");
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
