// hooks/dashboard/useManuscriptData.ts
import { useState, useCallback } from 'react';
import type { Chapter, Scene } from '../../lib/types';
import { getScenesByChapterId } from '../../lib/data/scenes';
import { toast } from 'sonner';
import { countWords } from '../../lib/utils';

export function useManuscriptData(projectId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false); // Default to false
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [scenesForSelectedChapter, setScenesForSelectedChapter] = useState<Scene[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [currentSceneWordCount, setCurrentSceneWordCount] = useState(0);

  const fetchProjectChapters = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingChapters(true);
    setSelectedChapter(null); // Reset dependent states
    setScenesForSelectedChapter([]);
    setSelectedScene(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/chapters`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to load chapters."}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const fetchedChapters: Chapter[] = await response.json();
      setChapters(fetchedChapters.sort((a,b) => a.order - b.order));
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
      setScenesForSelectedChapter(fetchedScenes.sort((a,b) => a.order - b.order));
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
    if (!selectedScene || !selectedChapter) {
      toast.error("No scene or chapter selected to save.");
      return null;
    }
    const wordCount = countWords(text);
    setCurrentSceneWordCount(wordCount);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/chapters/${selectedChapter.id}/scenes/${selectedScene.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }), // word_count is handled by DB trigger
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save scene content.");
      }
      const updatedSceneFromServer: Scene = await response.json();
      setSelectedScene((prev) => prev ? { ...prev, content: text, word_count: updatedSceneFromServer.word_count } : null);
      setScenesForSelectedChapter((prevScenes) =>
        prevScenes.map((s) =>
          s.id === selectedScene.id ? { ...s, content: text, word_count: updatedSceneFromServer.word_count } : s
        )
      );
      return updatedSceneFromServer;
    } catch (error) {
      console.error("useManuscriptData: Failed to save scene content:", error);
      toast.error(error instanceof Error ? error.message : "Could not save scene.");
      // Optionally re-fetch scene to revert optimistic updates
      return null;
    }
  }, [projectId, selectedChapter, selectedScene]);

  const handleChapterCreated = useCallback((newChapter: Chapter) => {
    setChapters((prev) => [...prev, newChapter].sort((a, b) => a.order - b.order));
  }, []);

  const handleSceneCreated = useCallback((newScene: Scene) => {
    setScenesForSelectedChapter((prev) => [...prev, newScene].sort((a, b) => a.order - b.order));
    setSelectedScene(newScene); // Optionally auto-select new scene
  }, []);
  
  const refreshChapters = useCallback(() => {
    if (projectId) {
        fetchProjectChapters();
    }
  }, [projectId, fetchProjectChapters]);

  // Expose a way to update scenes locally for drag-drop, then trigger persistence
  const updateLocalSceneOrder = useCallback((reorderedScenes: Scene[]) => {
    setScenesForSelectedChapter(reorderedScenes);
  }, []);


  return {
    chapters, setChapters, // Expose setChapters for outline updates
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
  };
}
