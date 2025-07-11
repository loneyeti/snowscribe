// components/dashboard/sections/ManuscriptSection/index.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Project, Scene, Chapter } from "@/lib/types";
import { useManuscriptData } from "@/hooks/dashboard/useManuscriptData";
import { useSceneDragDrop } from "@/hooks/dashboard/useSceneDragDrop";
import { useProjectData } from "@/contexts/ProjectDataContext";

import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
// import { ManuscriptEditor } from "@/components/editors/ManuscriptEditor";
import { CreateChapterModal } from "@/components/manuscript/CreateChapterModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal";
import { Paragraph } from "@/components/typography/Paragraph";
import { PlusCircle, ArrowLeft, Sparkles, Info } from "lucide-react";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { SceneMetadataPanel } from "@/components/manuscript/SceneMetadataPanel";
import { cn } from "@/lib/utils";
import { cactusSerif } from "@/lib/fonts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getChapters } from "@/lib/data/chapters";
import { useSearchParams } from "next/navigation";
import { UpdateSceneValues } from "@/lib/schemas/scene.schema";
import {
  updateScene,
  updateSceneCharacters,
  updateSceneTags,
  getScenesByChapterId,
} from "@/lib/data/scenes";
import dynamic from "next/dynamic";
//import { useMemo } from 'react';

type ManuscriptView = "chapters" | "scenes";

interface ManuscriptSectionProps {
  project: Project;
}

const EditorLoadingSkeleton = () => (
  <div className="max-w-[70ch] w-full min-h-[50vh] flex-1 p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

// --- Dynamically import ManuscriptEditor ---
const ManuscriptEditorWithNoSSR = dynamic(
  // The path to your component
  () =>
    import("@/components/editors/ManuscriptEditor").then(
      (mod) => mod.ManuscriptEditor
    ),
  {
    // Important: Disable Server-Side Rendering
    ssr: false,
    // Optional: Show a loading component while the editor is being fetched
    loading: () => <EditorLoadingSkeleton />,
  }
);

export function ManuscriptSection({ project }: ManuscriptSectionProps) {
  const {
    chapters,
    isLoadingChapters,
    selectedChapter,
    scenesForSelectedChapter,
    isLoadingScenes,
    selectedScene,
    currentSceneWordCount,
    fetchProjectChapters,
    fetchScenesForChapter,
    handleChapterSelect: dataHandleChapterSelect,
    handleBackToChapters: dataHandleBackToChapters,
    handleSceneSelect: dataHandleSceneSelect,
    handleSaveSceneContent,
    handleWordCountUpdate,
    handleChapterCreated: dataHandleChapterCreated,
    handleSceneCreated: dataHandleSceneCreated,
    updateLocalSceneOrder,
    setScenesForSelectedChapter,
    setSelectedScene,
  } = useManuscriptData(project.id);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { allProjectCharacters, allSceneTags } = useProjectData();
  const hasInitialFetchCompleted = useRef(false);

  const [isHandlingDeepLink, setIsHandlingDeepLink] = useState(false);
  const processedSceneIdRef = useRef<string | null>(null);

  // Handle deep linking from URL
  useEffect(() => {
    const chapterId = searchParams.get("chapterId");
    const sceneId = searchParams.get("sceneId");

    // Only run if we have a sceneId and it's different from the one we last processed
    if (sceneId && sceneId !== processedSceneIdRef.current) {
      processedSceneIdRef.current = sceneId; // Set the latch immediately
      if (!chapterId) return; // Ensure chapterId exists before proceeding

      const handleDeepLink = async () => {
        setIsHandlingDeepLink(true);
        try {
          // 1. Fetch all chapters if not already loaded
          let allChapters = chapters;
          if (allChapters.length === 0) {
            const data = await getChapters(project.id);
            if (!Array.isArray(data)) {
              throw new Error("Invalid chapters data format received");
            }
            allChapters = data.sort(
              (a: Chapter, b: Chapter) => a.order - b.order
            );
          }

          // 2. Find and select the target chapter
          const targetChapter = allChapters.find((c) => c.id === chapterId);
          if (!targetChapter) {
            throw new Error("Chapter specified in URL not found");
          }
          dataHandleChapterSelect(targetChapter);
          setManuscriptView("scenes");

          // 3. Fetch scenes for the target chapter
          const scenesForChapter = await getScenesByChapterId(
            project.id,
            chapterId
          );
          if (!Array.isArray(scenesForChapter)) {
            throw new Error("Invalid scenes data format received");
          }
          const sortedScenes = scenesForChapter.sort(
            (a, b) => a.order - b.order
          );
          setScenesForSelectedChapter(sortedScenes);

          // 4. Find and select the target scene
          const targetScene = sortedScenes.find((s) => s.id === sceneId);
          if (!targetScene) {
            throw new Error(
              `Scene ${sceneId} not found in chapter ${chapterId}`
            );
          }
          dataHandleSceneSelect(targetScene);

          // Clean up URL after deep link is handled
          const newUrl = `/project/${project.id}?section=manuscript`;
          router.replace(newUrl, { scroll: false });
          toast.success(
            `Navigated to scene: ${targetScene.title || "Untitled Scene"}`
          );
          processedSceneIdRef.current = null; // Reset latch after successful navigation
        } catch (error) {
          console.error("Deep link navigation failed:", {
            error,
            chapterId,
            sceneId,
            projectId: project.id,
          });
          toast.error(
            `Could not navigate to scene: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            {
              action: {
                label: "Retry",
                onClick: () => handleDeepLink(),
              },
            }
          );
          // Reset to a safe state
          dataHandleBackToChapters();
          setManuscriptView("chapters");
          processedSceneIdRef.current = null; // Reset latch on error too
        } finally {
          setIsHandlingDeepLink(false);
        }
      };

      handleDeepLink();
    }
  }, [
    searchParams,
    project.id,
    chapters,
    dataHandleChapterSelect,
    dataHandleSceneSelect,
    dataHandleBackToChapters,
    setScenesForSelectedChapter,
    router,
  ]);

  const [manuscriptView, setManuscriptView] =
    useState<ManuscriptView>("chapters");
  const [isCreateChapterModalOpen, setIsCreateChapterModalOpen] =
    useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSceneMetadataPanelOpen, setIsSceneMetadataPanelOpen] =
    useState(false);

  const {
    draggedSceneId,
    dragOverSceneId,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useSceneDragDrop(
    project.id,
    selectedChapter?.id ?? null,
    scenesForSelectedChapter,
    updateLocalSceneOrder
  );

  useEffect(() => {
    if (
      manuscriptView === "chapters" &&
      chapters.length === 0 &&
      !isLoadingChapters &&
      !hasInitialFetchCompleted.current
    ) {
      hasInitialFetchCompleted.current = true;
      fetchProjectChapters();
    }
  }, [
    manuscriptView,
    fetchProjectChapters,
    chapters.length,
    isLoadingChapters,
  ]);

  useEffect(() => {
    hasInitialFetchCompleted.current = false;
  }, [project.id]);

  const handleChapterSelect = (chapter: Chapter) => {
    dataHandleChapterSelect(chapter);
    setManuscriptView("scenes");
    fetchScenesForChapter(chapter.id);
  };

  const handleBackToChapters = () => {
    dataHandleBackToChapters();
    setManuscriptView("chapters");
  };

  const handleSceneCreated = (newScene: Scene) => {
    dataHandleSceneCreated(newScene);
    setIsCreateSceneModalOpen(false);
  };

  const handleChapterCreated = (newChapter: Chapter) => {
    dataHandleChapterCreated(newChapter);
    setIsCreateChapterModalOpen(false);
  };

  const handleSceneDetailsPanelUpdate = useCallback(
    async (
      updatedData: Partial<
        Pick<
          Scene,
          "outline_description" | "pov_character_id" | "primary_category"
        >
      >
    ) => {
      if (!selectedScene || !selectedChapter) {
        toast.error("No scene or chapter selected.");
        return;
      }
      try {
        const payload: UpdateSceneValues = {};
        if (updatedData.outline_description !== undefined)
          payload.outline_description = updatedData.outline_description;
        if (updatedData.pov_character_id !== undefined)
          payload.pov_character_id = updatedData.pov_character_id;
        if (updatedData.primary_category !== undefined)
          payload.primary_category = updatedData.primary_category;

        if (Object.keys(payload).length === 0) {
          toast.info("No changes to save.");
          return;
        }
        const updatedSceneFromAPI = await updateScene(
          project.id,
          selectedChapter.id,
          selectedScene.id,
          payload
        );
        setSelectedScene(updatedSceneFromAPI);
        setScenesForSelectedChapter((prevScenes) =>
          prevScenes.map((s) =>
            s.id === selectedScene.id ? updatedSceneFromAPI : s
          )
        );
        toast.success("Scene details updated.");
      } catch (error) {
        console.error("Failed to update scene details from panel:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update scene details."
        );
      }
    },
    [
      project.id,
      selectedChapter,
      selectedScene,
      setSelectedScene,
      setScenesForSelectedChapter,
    ]
  );

  const handleSceneDetailsPanelCharacterLinkChange = useCallback(
    async (characterIds: Array<{ character_id: string }>) => {
      if (!selectedScene || !selectedChapter) {
        toast.error("No scene or chapter selected.");
        return;
      }
      try {
        const idStrings = characterIds.map((c) => c.character_id);
        await updateSceneCharacters(project.id, selectedScene.id, idStrings);
        const updatedScenes = await getScenesByChapterId(
          project.id,
          selectedChapter.id
        );
        const freshSelectedScene = updatedScenes.find(
          (s) => s.id === selectedScene.id
        );
        if (freshSelectedScene) setSelectedScene(freshSelectedScene);
        setScenesForSelectedChapter(updatedScenes);
        toast.success("Scene characters updated.");
      } catch (error) {
        console.error("Failed to update scene characters from panel:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update scene characters."
        );
      }
    },
    [
      project.id,
      selectedChapter,
      selectedScene,
      setSelectedScene,
      setScenesForSelectedChapter,
    ]
  );

  const handleSceneDetailsPanelTagLinkChange = useCallback(
    async (tagIds: Array<{ tag_id: string }>) => {
      if (!selectedScene || !selectedChapter) {
        toast.error("No scene or chapter selected.");
        return;
      }
      try {
        const idStrings = tagIds.map((t) => t.tag_id);
        await updateSceneTags(project.id, selectedScene.id, idStrings);
        const updatedScenes = await getScenesByChapterId(
          project.id,
          selectedChapter.id
        );
        const freshSelectedScene = updatedScenes.find(
          (s) => s.id === selectedScene.id
        );
        if (freshSelectedScene) setSelectedScene(freshSelectedScene);
        setScenesForSelectedChapter(updatedScenes);
        toast.success("Scene tags updated.");
      } catch (error) {
        console.error("Failed to update scene tags from panel:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update scene tags."
        );
      }
    },
    [
      project.id,
      selectedChapter,
      selectedScene,
      setSelectedScene,
      setScenesForSelectedChapter,
    ]
  );

  if (isHandlingDeepLink) {
    return (
      <div className="flex items-center justify-center h-full">
        <Paragraph className="text-muted-foreground">
          Loading scene...
        </Paragraph>
      </div>
    );
  }

  const middleColumnContent = (
    <>
      {manuscriptView === "chapters" && (
        <>
          <ContextualHeader
            title="Chapters"
            navControls={
              <IconButton
                icon={PlusCircle}
                aria-label="New Chapter"
                onClick={() => setIsCreateChapterModalOpen(true)}
              />
            }
          />
          <ListContainer>
            {isLoadingChapters ? (
              <Paragraph className="p-4 text-sm text-muted-foreground">
                Loading chapters...
              </Paragraph>
            ) : chapters.length > 0 ? (
              chapters.map((chapter) => (
                <ListItem
                  key={chapter.id}
                  title={`Chapter ${chapter.order + 1}: ${chapter.title}`}
                  secondaryText={
                    chapter.word_count
                      ? `${chapter.word_count} words`
                      : "No word count"
                  }
                  onClick={() => handleChapterSelect(chapter)}
                  isSelected={selectedChapter?.id === chapter.id}
                />
              ))
            ) : (
              <Paragraph className="p-4 text-sm text-muted-foreground">
                No chapters yet.
              </Paragraph>
            )}
          </ListContainer>
        </>
      )}
      {manuscriptView === "scenes" && selectedChapter && (
        <>
          <ContextualHeader
            title={selectedChapter.title}
            navControls={
              <>
                <IconButton
                  icon={ArrowLeft}
                  aria-label="Back to Chapters"
                  onClick={handleBackToChapters}
                  className="mr-2"
                />
                <IconButton
                  icon={PlusCircle}
                  aria-label="New Scene"
                  onClick={() => setIsCreateSceneModalOpen(true)}
                />
              </>
            }
          />
          <ListContainer>
            {isLoadingScenes ? (
              <Paragraph className="p-4 text-sm text-muted-foreground">
                Loading scenes...
              </Paragraph>
            ) : scenesForSelectedChapter.length > 0 ? (
              scenesForSelectedChapter.map((scene) => (
                <ListItem
                  key={scene.id}
                  title={scene.title || "Untitled Scene"}
                  secondaryText={`${scene.word_count || 0} words`}
                  onClick={() => dataHandleSceneSelect(scene)}
                  isSelected={selectedScene?.id === scene.id}
                  draggable={true}
                  dataId={scene.id}
                  onDragStart={(e) => handleDragStart(e, scene.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, scene.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, scene.id)}
                  className={cn(
                    draggedSceneId === scene.id && "opacity-30",
                    dragOverSceneId === scene.id &&
                      draggedSceneId !== scene.id &&
                      "border-t-2 border-primary pt-[calc(0.75rem-2px)] pb-[0.75rem]"
                  )}
                />
              ))
            ) : (
              <Paragraph className="p-4 text-sm text-muted-foreground">
                No scenes in this chapter.
              </Paragraph>
            )}
          </ListContainer>
        </>
      )}
    </>
  );

  const mainDetailColumnContent = (
    <>
      {selectedScene ? (
        <div className="flex flex-col h-full">
          <ContextualHeader
            title={selectedScene.title || "Untitled Scene"}
            subtitle={`${currentSceneWordCount} words`}
            centered={true}
            className={`${cactusSerif.className} text-center`}
            navControls={
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAIPanelOpen(true);
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Open AI Assistant"
                >
                  <Sparkles className="h-5 w-5" />
                </button>
                <IconButton
                  icon={Info}
                  aria-label={
                    isSceneMetadataPanelOpen
                      ? "Hide scene details"
                      : "Show scene details"
                  }
                  onClick={() => setIsSceneMetadataPanelOpen((prev) => !prev)}
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-muted-foreground hover:text-primary"
                />
              </>
            }
          />
          <ManuscriptEditorWithNoSSR
            key={selectedScene.id}
            initialText={selectedScene.content || undefined}
            saveText={async (text: string) => {
              const updatedScene = await handleSaveSceneContent(text);
              if (updatedScene) {
                // router.refresh();
              }
            }}
            onWordCountChange={handleWordCountUpdate}
            font={cactusSerif}
            placeholder="Start writing your scene..."
          />
        </div>
      ) : (
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            {manuscriptView === "scenes" && selectedChapter
              ? "Select a scene to start writing."
              : "Select a chapter, then a scene."}
          </Paragraph>
        </div>
      )}
    </>
  );

  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />
      {isCreateChapterModalOpen && (
        <CreateChapterModal
          projectId={project.id}
          isOpen={isCreateChapterModalOpen}
          onClose={() => setIsCreateChapterModalOpen(false)}
          onChapterCreated={handleChapterCreated}
        />
      )}
      {isCreateSceneModalOpen && selectedChapter && (
        <CreateSceneModal
          projectId={project.id}
          chapterId={selectedChapter.id}
          isOpen={isCreateSceneModalOpen}
          onClose={() => setIsCreateSceneModalOpen(false)}
          onSceneCreated={handleSceneCreated}
        />
      )}
      {selectedScene && selectedChapter && (
        <SceneMetadataPanel
          isOpen={isSceneMetadataPanelOpen}
          onClose={() => setIsSceneMetadataPanelOpen(false)}
          scene={selectedScene}
          projectId={project.id}
          allProjectCharacters={allProjectCharacters}
          allProjectSceneTags={allSceneTags}
          onSceneUpdate={handleSceneDetailsPanelUpdate}
          onCharacterLinkChange={handleSceneDetailsPanelCharacterLinkChange}
          onTagLinkChange={handleSceneDetailsPanelTagLinkChange}
        />
      )}
      {isAIPanelOpen && selectedScene && (
        <AISidePanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
          title={`AI Assistant - ${selectedScene.title || "Scene"}`}
          componentType="tool"
          toolName="scene_helper"
          defaultPrompt={`Help me improve this scene: ${
            selectedScene.content || "Untitled Scene Content"
          }`}
          defaultSystemPrompt="You are a helpful writing assistant specialized in fiction. Help the user improve their scene by providing constructive feedback and suggestions."
        />
      )}
    </>
  );
}
