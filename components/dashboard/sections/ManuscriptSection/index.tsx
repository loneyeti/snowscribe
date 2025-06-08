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
import { ManuscriptEditor } from "@/components/editors/ManuscriptEditor";
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
import { useSearchParams } from "next/navigation";
import { UpdateSceneValues } from "@/lib/schemas/scene.schema";
import {
  updateScene,
  updateSceneCharacters,
  updateSceneTags,
  getScenesByChapterId,
} from "@/lib/data/scenes";

type ManuscriptView = "chapters" | "scenes";

interface ManuscriptSectionProps {
  project: Project;
  isActive: boolean;
}

export function ManuscriptSection({
  project,
  isActive,
}: ManuscriptSectionProps) {
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
    handleChapterCreated: dataHandleChapterCreated,
    handleSceneCreated: dataHandleSceneCreated,
    updateLocalSceneOrder,
    setScenesForSelectedChapter,
    setSelectedScene,
  } = useManuscriptData(project.id);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { allProjectCharacters, allSceneTags } = useProjectData();

  const [isHandlingDeepLink, setIsHandlingDeepLink] = useState(false);
  const processedSceneIdRef = useRef<string | null>(null);

  // Handle deep linking from URL
  useEffect(() => {
    if (!isActive) return;

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
            const response = await fetch(
              `/api/projects/${project.id}/chapters`
            );
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.message || "Failed to load chapters from server"
              );
            }
            const data = await response.json();
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
    isActive,
    searchParams,
    project.id,
    chapters,
    dataHandleChapterSelect,
    dataHandleSceneSelect,
    dataHandleBackToChapters,
    setScenesForSelectedChapter,
  ]);

  const [manuscriptView, setManuscriptView] =
    useState<ManuscriptView>("chapters");
  const [isCreateChapterModalOpen, setIsCreateChapterModalOpen] =
    useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSceneMetadataPanelOpen, setIsSceneMetadataPanelOpen] =
    useState(false);

  const persistSceneOrderBackend = useCallback(
    async (projId: string, chapId: string, reorderedScenes: Scene[]) => {
      if (!chapId || reorderedScenes.length === 0) return;

      const scenesWithNewOrder = reorderedScenes.map((scene, index) => ({
        id: scene.id,
        order: index,
      }));

      const toastId = toast.loading("Saving new scene order...");
      try {
        const response = await fetch(
          `/api/projects/${projId}/chapters/${chapId}/scenes/reorder`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenes: scenesWithNewOrder }),
          }
        );
        if (response.ok) {
          toast.success("Scene order saved!", { id: toastId });
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Failed to save order." }));
          toast.error(errorData.error || "Could not save scene order.", {
            id: toastId,
          });
          await fetchScenesForChapter(chapId);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error saving scene order.",
          { id: toastId }
        );
        await fetchScenesForChapter(chapId);
      }
    },
    [fetchScenesForChapter]
  );

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
    updateLocalSceneOrder,
    persistSceneOrderBackend
  );

  useEffect(() => {
    if (isActive) {
      if (
        manuscriptView === "chapters" &&
        chapters.length === 0 &&
        !isLoadingChapters
      ) {
        fetchProjectChapters();
      }
    } else {
      setManuscriptView("chapters");
      dataHandleBackToChapters();
    }
  }, [
    isActive,
    manuscriptView,
    fetchProjectChapters,
    chapters.length,
    isLoadingChapters,
    dataHandleBackToChapters,
  ]);

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
    async (characterIds: string[]) => {
      if (!selectedScene || !selectedChapter) {
        toast.error("No scene or chapter selected.");
        return;
      }
      try {
        await updateSceneCharacters(project.id, selectedScene.id, characterIds);
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
    async (tagIds: string[]) => {
      if (!selectedScene || !selectedChapter) {
        toast.error("No scene or chapter selected.");
        return;
      }
      try {
        await updateSceneTags(project.id, selectedScene.id, tagIds);
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

  if (!isActive) return null;

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
        <div className="flex flex-col h-full items-center relative">
          <div className="text-center p-2">
            <div className="flex items-center">
              <h1
                className={`text-2xl ${cactusSerif.className} font-bold mr-2`}
              >
                {selectedScene.title || "Untitled Scene"}
              </h1>
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
            </div>
            <span className="text-sm italic text-gray-500">
              {currentSceneWordCount} words
            </span>
          </div>
          <ManuscriptEditor
            key={selectedScene.id}
            initialText={selectedScene.content || ""}
            saveText={async (text: string) => {
              const updatedScene = await handleSaveSceneContent(text);
              if (updatedScene) {
                router.refresh();
              }
            }}
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
