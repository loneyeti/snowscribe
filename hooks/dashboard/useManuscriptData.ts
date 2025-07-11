// hooks/dashboard/useManuscriptData.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Chapter, Scene } from '../../lib/types';
import { getChapters } from '../../lib/data/chapters';
import { getScenesByChapterId, updateScene } from '../../lib/data/scenes';
import { toast } from 'sonner';

export function useManuscriptData(projectId: string) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingDeepLink, setIsLoadingDeepLink] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false); // Default to false
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [scenesForSelectedChapter, setScenesForSelectedChapter] = useState<Scene[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [currentSceneWordCount, setCurrentSceneWordCount] = useState(0);
  const selectedSceneRef = useRef(selectedScene);
  
  useEffect(() => {
    selectedSceneRef.current = selectedScene;
  }, [selectedScene]);

  const fetchProjectChapters = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingChapters(true);
    setSelectedChapter(null); // Reset dependent states
    setScenesForSelectedChapter([]);
    setSelectedScene(null);
    try {
      const fetchedChapters = await getChapters(projectId);
      setChapters(fetchedChapters.sort((a: Chapter, b: Chapter) => a.order - b.order));
    } catch (error) {
      console.error("useManuscriptData: Failed to fetch chapters:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load chapters.");
      setChapters([]); // Ensure chapters is an array on error
    } finally {
      setIsLoadingChapters(false);
    }
  }, [projectId]);

  const fetchScenesForChapter = useCallback(async (chapterId: string) => {
    if (!projectId || !chapterId) return;
    setIsLoadingScenes(true);
    setSelectedScene(null); // Clear previously selected scene from other chapter
    try {
      const fetchedScenes = await getScenesByChapterId(projectId, chapterId);
      
      // Correct word count for any blank scenes on fetch
      const correctedScenes = fetchedScenes.map(scene => ({
        ...scene,
        word_count: (!scene.content || scene.content.trim() === '') ? 0 : scene.word_count,
      }));

      setScenesForSelectedChapter(correctedScenes.sort((a,b) => a.order - b.order));
    } catch (error) {
      console.error(`useManuscriptData: Failed to fetch scenes for chapter ${chapterId}:`, error);
      toast.error("Failed to load scenes for the chapter.");
      setScenesForSelectedChapter([]);
    } finally {
      setIsLoadingScenes(false);
    }
  }, [projectId]);

  const handleChapterSelect = useCallback((chapter: Chapter) => {
    setSelectedChapter(chapter);
    // ManuscriptSection will change view to 'scenes' and call fetchScenesForChapter
  }, []);

  const handleBackToChapters = useCallback(() => {
    setSelectedChapter(null);
    setScenesForSelectedChapter([]);
    setSelectedScene(null);
    // ManuscriptSection will change view to 'chapters'
  }, []);

  const handleSceneSelect = useCallback((scene: Scene) => {
    setSelectedScene(scene);
    setCurrentSceneWordCount(scene.word_count || 0);
  }, []);

  const handleSaveSceneContent = useCallback(async (text: string) => {
    // We capture the scene from the closure. This is the scene this save function is "for".
    if (!selectedScene || !selectedChapter) {
      return null;
    }
    
    const sceneBeingSaved = selectedScene;

    try {
      // The async database call proceeds as normal.
      const updatedSceneFromServer = await updateScene(
        projectId,
        selectedChapter.id,
        sceneBeingSaved.id,
        { content: text } 
      );

      // This is always safe: keep the list of scenes in the sidebar fresh.
      setScenesForSelectedChapter((prevScenes) =>
        prevScenes.map((s) =>
          s.id === sceneBeingSaved.id ? updatedSceneFromServer : s
        )
      );
      
      // --- FIX PART 2: SAFE STATE RECONCILIATION ---
      // This is the logic from the previous fix. It prevents a stale save (from an unmounted editor)
      // from overwriting the newly selected scene's state.
      setSelectedScene(currentActiveScene => {
          if (currentActiveScene && currentActiveScene.id === sceneBeingSaved.id) {
              // The saved scene is still the active one. It's safe to update it
              // with the authoritative data from the server.
              return updatedSceneFromServer;
          }
          // This was a stale save. Don't change the active scene.
          return currentActiveScene;
      });

      // We don't need to set the word count again here. The `setSelectedScene` call above
      // updates the scene object, and the optimistic update has already handled the display.
      // The UI will be consistent after the next render.

      return updatedSceneFromServer;
    } catch (error) {
      console.error("useManuscriptData: Failed to save scene content:", error);
      toast.error(error instanceof Error ? error.message : "Could not save scene.");
      return null;
    }
  }, [projectId, selectedChapter, selectedScene]);

  const handleChapterCreated = useCallback((newChapter: Chapter) => {
    setChapters((prev) => [...prev, newChapter].sort((a, b) => a.order - b.order));
  }, []);

  const handleSceneCreated = useCallback((newScene: Scene) => {
    // Correct word count for a newly created blank scene
    const correctedScene = {
      ...newScene,
      word_count: (!newScene.content || newScene.content.trim() === '') ? 0 : newScene.word_count,
    };
    
    setScenesForSelectedChapter((prev) => [...prev, correctedScene].sort((a, b) => a.order - b.order));
    setSelectedScene(correctedScene); // Optionally auto-select new scene
    setCurrentSceneWordCount(correctedScene.word_count || 0); // Also set the editor's word count
  }, []);
  
  const refreshChapters = useCallback(() => {
    if (projectId) {
        fetchProjectChapters();
    }
  }, [projectId, fetchProjectChapters]);

  // Expose a way to update scenes locally for drag-drop, then trigger persistence
  const handleWordCountUpdate = useCallback((count: number) => {
    setCurrentSceneWordCount(count);
  }, []);

  const updateLocalSceneOrder = useCallback((reorderedScenes: Scene[]) => {
    setScenesForSelectedChapter(reorderedScenes);
  }, []);


  const handleDeepLink = useCallback(async (chapterId: string, sceneId: string) => {
    if (isLoadingDeepLink) return;

    setIsLoadingDeepLink(true);
    const toastId = toast.loading("Navigating to scene...");

    try {
      // 1. Fetch all chapters if not already present
      let allChapters = chapters;
      if (allChapters.length === 0) {
        const fetchedChapters = await getChapters(projectId);
        if (!fetchedChapters) throw new Error("Failed to load chapters for navigation.");
        allChapters = fetchedChapters.sort((a: Chapter, b: Chapter) => a.order - b.order);
        setChapters(allChapters);
      }

      // 2. Find and select the target chapter
      const targetChapter = allChapters.find(c => c.id === chapterId);
      if (!targetChapter) throw new Error("Chapter specified in URL not found.");
      setSelectedChapter(targetChapter);

      // 3. Fetch scenes for the target chapter
      setIsLoadingScenes(true);
      const scenesForChapter = await getScenesByChapterId(projectId, chapterId);
      const sortedScenes = scenesForChapter.sort((a,b) => a.order - b.order);
      setScenesForSelectedChapter(sortedScenes);
      setIsLoadingScenes(false);

      // 4. Find and select the target scene
      const targetScene = sortedScenes.find(s => s.id === sceneId);
      if (!targetScene) throw new Error("Scene specified in URL not found.");
      
      // Set the scene and its word count
      setSelectedScene(targetScene);
      setCurrentSceneWordCount(targetScene.word_count || 0);

      // 5. Clean up URL after successful deep link
      const newUrl = `/project/${projectId}?section=manuscript`;
      router.replace(newUrl, { scroll: false });

      toast.success("Navigated to scene successfully!", { id: toastId });

    } catch (error) {
      console.error("Deep link navigation failed:", error);
      toast.error(error instanceof Error ? error.message : "Could not navigate to the specified scene.", { id: toastId });
      setSelectedChapter(null);
      setSelectedScene(null);
    } finally {
      setIsLoadingDeepLink(false);
    }
  }, [projectId, router, chapters, isLoadingDeepLink]);

  return {
    chapters, setChapters, // Expose setChapters for outline updates
    handleDeepLink,
    isLoadingChapters,
    selectedChapter, setSelectedChapter,
    scenesForSelectedChapter, setScenesForSelectedChapter, // Expose setScenes for outline/drag-drop
    isLoadingScenes,
    selectedScene, setSelectedScene, // Expose setSelectedScene for outline
    currentSceneWordCount,
    fetchProjectChapters,
    fetchScenesForChapter,
    handleChapterSelect,
    handleBackToChapters,
    handleSceneSelect,
    handleSaveSceneContent,
    handleChapterCreated,
    handleSceneCreated,
    refreshChapters,
    updateLocalSceneOrder,
    handleWordCountUpdate, // Export the word count update handler
  };
}
