import React, { useState, useEffect, useCallback } from "react";
import type { Scene, Chapter } from "@/lib/types";
import { useProjectStore } from "@/lib/stores/projectStore";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
import { CreateChapterModal } from "@/components/manuscript/CreateChapterModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal";
import { Paragraph } from "@/components/typography/Paragraph";
import { PlusCircle, ArrowLeft, Sparkles, Info } from "lucide-react";
import { AISidePanel } from "@/components/ai/AISidePanel";
import { SceneMetadataPanel } from "@/components/manuscript/SceneMetadataPanel";
import { cn } from "@/lib/utils";
import { cactusSerif } from "@/lib/fonts";
import { toast } from "sonner";
import { updateSceneCharacters, updateSceneTags } from "@/lib/data/scenes";
import dynamic from "next/dynamic";
import { countWords } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

type ManuscriptView = "chapters" | "scenes";

const EditorLoadingSkeleton = () => (
  <div className="max-w-[70ch] w-full min-h-[50vh] flex-1 p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
  </div>
);

const ManuscriptEditorWithNoSSR = dynamic(
  () =>
    import("@/components/editors/ManuscriptEditor").then(
      (mod) => mod.ManuscriptEditor
    ),
  {
    ssr: false,
    loading: () => <EditorLoadingSkeleton />,
  }
);

export function ManuscriptSection() {
  const {
    project,
    chapters,
    isLoading,
    selectedChapter,
    selectedScene,
    createChapter,
    createScene,
    updateScene: updateSceneInStore,
    reorderScenes,
    selectChapter,
    selectScene,
  } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      chapters: state.chapters,
      isLoading: state.isLoading,
      selectedChapter: state.selectedChapter,
      selectedScene: state.selectedScene,
      createChapter: state.createChapter,
      createScene: state.createScene,
      updateScene: state.updateScene,
      reorderScenes: state.reorderScenes,
      selectChapter: state.selectChapter,
      selectScene: state.selectScene,
    }))
  );

  const [manuscriptView, setManuscriptView] =
    useState<ManuscriptView>("chapters");
  const [isCreateChapterModalOpen, setIsCreateChapterModalOpen] =
    useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSceneMetadataPanelOpen, setIsSceneMetadataPanelOpen] =
    useState(false);
  const [currentSceneWordCount, setCurrentSceneWordCount] = useState(0);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedScene) {
      setCurrentSceneWordCount(countWords(selectedScene.content));
    }
  }, [selectedScene]);

  const scenesForSelectedChapter =
    chapters.find((c) => c.id === selectedChapter?.id)?.scenes || [];

  const handleDragStart = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sceneId: string) => {
      setDraggedSceneId(sceneId);
      event.dataTransfer.setData("text/plain", sceneId);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    []
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>, sceneId: string) => {
      event.preventDefault();
      if (sceneId !== draggedSceneId) {
        setDragOverSceneId(sceneId);
      }
    },
    [draggedSceneId]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverSceneId(null);
    },
    []
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>, targetSceneId: string) => {
      event.preventDefault();
      const sourceSceneId = event.dataTransfer.getData("text/plain");

      setDraggedSceneId(null);
      setDragOverSceneId(null);

      if (
        !selectedChapter ||
        !sourceSceneId ||
        sourceSceneId === targetSceneId
      ) {
        return;
      }

      const scenes =
        chapters.find((c) => c.id === selectedChapter.id)?.scenes || [];
      const sourceIndex = scenes.findIndex((s) => s.id === sourceSceneId);
      const targetIndex = scenes.findIndex((s) => s.id === targetSceneId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const reorderedScenes = [...scenes];
        const [draggedItem] = reorderedScenes.splice(sourceIndex, 1);
        reorderedScenes.splice(targetIndex, 0, draggedItem);

        const scenesWithNewOrder = reorderedScenes.map((scene, index) => ({
          id: scene.id,
          order: index,
        }));

        // Call the store action. It handles the optimistic update and API call.
        reorderScenes(selectedChapter.id, scenesWithNewOrder);
      }
    },
    [selectedChapter, chapters, reorderScenes]
  );

  const handleChapterSelect = (chapter: Chapter) => {
    selectChapter(chapter);
    setManuscriptView("scenes");
  };

  const handleBackToChapters = () => {
    selectChapter(null);
    setManuscriptView("chapters");
  };

  const handleSaveSceneContent = async (text: string) => {
    if (selectedScene && selectedChapter) {
      await updateSceneInStore(selectedChapter.id, selectedScene.id, {
        content: text,
      });
    }
  };

  const handleSceneDetailsPanelUpdate = async (updatedData: Partial<Scene>) => {
    if (selectedScene && selectedChapter) {
      // Filter out null values to match expected type
      const filteredData = Object.fromEntries(
        Object.entries(updatedData).filter(([_, value]) => value !== null)
      );
      await updateSceneInStore(
        selectedChapter.id,
        selectedScene.id,
        filteredData
      );
    }
  };

  const handleSceneDetailsPanelCharacterLinkChange = useCallback(
    async (characterIds: Array<{ character_id: string }>) => {
      if (!selectedScene || !selectedChapter || !project) return;
      try {
        await updateSceneCharacters(
          project.id,
          selectedScene.id,
          characterIds.map((c) => c.character_id)
        );
        await selectChapter(selectedChapter); // Re-fetch scenes to get updated data
        toast.success("Scene characters updated.");
      } catch (e) {
        toast.error("Failed to update scene characters.");
      }
    },
    [project, selectedChapter, selectedScene, selectChapter]
  );

  const handleSceneDetailsPanelTagLinkChange = useCallback(
    async (tagIds: Array<{ tag_id: string }>) => {
      if (!selectedScene || !selectedChapter || !project) return;
      try {
        await updateSceneTags(
          project.id,
          selectedScene.id,
          tagIds.map((t) => t.tag_id)
        );
        await selectChapter(selectedChapter); // Re-fetch scenes to get updated data
        toast.success("Scene tags updated.");
      } catch (e) {
        toast.error("Failed to update scene tags.");
      }
    },
    [project, selectedChapter, selectedScene, selectChapter]
  );

  if (!project) {
    return <div>Loading project...</div>;
  }

  const middleColumnContent = (
    <>
      {manuscriptView === "chapters" ? (
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
            {isLoading.chapters ? (
              <Paragraph className="p-4 text-sm text-muted-foreground">
                Loading chapters...
              </Paragraph>
            ) : chapters.length > 0 ? (
              chapters.map((chapter) => (
                <ListItem
                  key={chapter.id}
                  title={`Chapter ${chapter.order + 1}: ${chapter.title}`}
                  secondaryText={`${chapter.word_count || 0} words`}
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
      ) : (
        selectedChapter && (
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
              {isLoading.scenes ? (
                <Paragraph className="p-4 text-sm text-muted-foreground">
                  Loading scenes...
                </Paragraph>
              ) : scenesForSelectedChapter.length > 0 ? (
                scenesForSelectedChapter.map((scene) => (
                  <ListItem
                    key={scene.id}
                    title={scene.title || "Untitled Scene"}
                    secondaryText={`${countWords(scene.content)} words`}
                    onClick={() => selectScene(scene)}
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
        )
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
                <IconButton
                  icon={Sparkles}
                  aria-label="Open AI Assistant"
                  onClick={() => setIsAIPanelOpen(true)}
                />
                <IconButton
                  icon={Info}
                  aria-label="Show scene details"
                  onClick={() => setIsSceneMetadataPanelOpen(true)}
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
            saveText={handleSaveSceneContent}
            onWordCountChange={setCurrentSceneWordCount}
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
      {isCreateChapterModalOpen && project && (
        <CreateChapterModal
          isOpen={isCreateChapterModalOpen}
          onClose={() => setIsCreateChapterModalOpen(false)}
          projectId={project.id}
          onChapterCreated={(data) => {
            // Close the modal immediately
            setIsCreateChapterModalOpen(false);

            // Call the create action without awaiting it.
            // The store will update the UI when this is done.
            createChapter(data.title);
          }}
        />
      )}
      {isCreateSceneModalOpen && selectedChapter && project && (
        <CreateSceneModal
          isOpen={isCreateSceneModalOpen}
          onClose={() => setIsCreateSceneModalOpen(false)}
          projectId={project.id}
          chapterId={selectedChapter.id}
          onSceneCreated={(data) => {
            // Close the modal immediately
            setIsCreateSceneModalOpen(false);

            // Call the create action without awaiting it.
            createScene(
              selectedChapter.id,
              data.title,
              data.primary_category as string
            );
          }}
        />
      )}
      {selectedScene && selectedChapter && (
        <SceneMetadataPanel
          isOpen={isSceneMetadataPanelOpen}
          onClose={() => setIsSceneMetadataPanelOpen(false)}
          scene={selectedScene}
          projectId={project.id}
          onSceneUpdate={handleSceneDetailsPanelUpdate}
          onCharacterLinkChange={handleSceneDetailsPanelCharacterLinkChange}
          onTagLinkChange={handleSceneDetailsPanelTagLinkChange}
        />
      )}
      {isAIPanelOpen &&
        selectedScene &&
        project && ( // Ensure project exists
          <AISidePanel
            isOpen={isAIPanelOpen}
            onClose={() => setIsAIPanelOpen(false)}
            title={`AI Assistant - ${selectedScene.title || "Scene"}`}
            componentType="tool"
            toolName="Scene Analyzer"
            defaultPrompt={`Help me improve this scene: ${
              selectedScene.content || "Untitled Scene Content"
            }`}
            defaultSystemPrompt="You are a helpful writing assistant specialized in fiction. Help the user improve their scene by providing constructive feedback and suggestions."
            projectId={project.id} // Add this line
            contextData={{ scene: selectedScene }} // Add this line
          />
        )}
    </>
  );
}
