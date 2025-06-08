// components/dashboard/sections/OutlineSection/index.tsx
import React, { useState, useCallback } from "react";
import type { Project, Scene } from "@/lib/types";
import { useOutlineData } from "@/hooks/dashboard/useOutlineData";
import { useManuscriptData } from "@/hooks/dashboard/useManuscriptData"; // For character management
import { useCharactersData } from "@/hooks/dashboard/useCharactersData"; // For characters list
import { useProjectData } from "@/contexts/ProjectDataContext"; // For allSceneTags

import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { FileText, ClipboardList, Sparkles } from "lucide-react";
import { ProjectSynopsisEditor } from "@/components/outline/ProjectSynopsisEditor";
import { CharacterCardQuickViewList } from "@/components/outline/CharacterCardQuickViewList";
import { ChapterSceneOutlineList } from "@/components/outline/ChapterSceneOutlineList";
import { Paragraph } from "@/components/typography/Paragraph";
import { toast } from "sonner";
import {
  generateAndParseOutline,
  createEntitiesFromOutline,
} from "@/lib/ai/outlineCreator";
import { OutlineCreatorModal } from "@/components/outline/OutlineCreatorModal";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

type OutlineView = "synopsis" | "scenes";

interface OutlineSectionProps {
  project: Project; // The full initial project object
  isActive: boolean;
}

export function OutlineSection({
  project: initialProject,
  isActive,
}: OutlineSectionProps) {
  const [outlineView, setOutlineView] = React.useState<OutlineView>("synopsis");

  const {
    project: currentProjectDetails,
    chapters,
    isLoading: isLoadingOutline,
    handleSynopsisUpdate,
    handleSceneOutlineUpdate: hookHandleSceneOutlineUpdate,
  } = useOutlineData(initialProject, initialProject.id);

  // Use manuscript data hook for character management
  const {
    fetchProjectChapters,
    setSelectedScene,
    setScenesForSelectedChapter,
    selectedChapter,
    setChapters,
  } = useManuscriptData(initialProject.id);

  // Centralized scene update handler
  const handleSceneUpdate = useCallback(
    async (chapterId: string, sceneId: string, updatedData: Partial<Scene>) => {
      try {
        // Update database
        const updatedScene = await hookHandleSceneOutlineUpdate(
          chapterId,
          sceneId,
          updatedData
        );

        if (!updatedScene) return;

        // Update chapters state to reflect changes
        setChapters((prevChapters) =>
          prevChapters.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  scenes:
                    chapter.scenes?.map((s) =>
                      s.id === sceneId ? { ...s, ...updatedScene } : s
                    ) || [],
                }
              : chapter
          )
        );

        // Update selected scene if it's the one being edited
        setSelectedScene((prev) =>
          prev && prev.id === sceneId ? { ...prev, ...updatedScene } : prev
        );

        // Update scenes for selected chapter if needed
        if (selectedChapter && selectedChapter.id === chapterId) {
          setScenesForSelectedChapter((prevScenes) =>
            prevScenes.map((s) =>
              s.id === sceneId ? { ...s, ...updatedScene } : s
            )
          );
        }

        toast.success("Scene updated successfully");
      } catch (error) {
        console.error("Failed to update scene:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update scene"
        );
      }
    },
    [
      hookHandleSceneOutlineUpdate,
      setChapters,
      setSelectedScene,
      setScenesForSelectedChapter,
      selectedChapter,
    ]
  );

  // Use characters data hook for character list
  const {
    characters: allCharactersForProject,
    fetchProjectCharacters: fetchAllChars,
    isLoadingCharactersData: isLoadingAllChars,
  } = useCharactersData(initialProject.id);

  React.useEffect(() => {
    if (isActive) {
      // Fetch data when section becomes active
      if (
        outlineView === "scenes" &&
        chapters.length === 0 &&
        !isLoadingOutline
      ) {
        fetchProjectChapters();
      }

      // Fetch characters when synopsis view is active and no characters are loaded
      if (
        outlineView === "synopsis" &&
        allCharactersForProject.length === 0 &&
        !isLoadingAllChars
      ) {
        fetchAllChars();
      }
    } else {
      // Reset view when section becomes inactive
      setOutlineView("synopsis");
    }
  }, [
    isActive,
    outlineView,
    chapters.length,
    isLoadingOutline,
    fetchProjectChapters,
    allCharactersForProject.length,
    isLoadingAllChars,
    fetchAllChars,
  ]);

  // Use project data context for all scene tags
  const { allSceneTags, isLoadingAllSceneTags, refreshAllSceneTags } =
    useProjectData();

  console.log("[OutlineSection] Current outlineView:", outlineView);
  console.log("[OutlineSection] Chapters length:", chapters.length);
  console.log("[OutlineSection] IsLoadingOutline:", isLoadingOutline);
  console.log(
    "[OutlineSection] allCharactersForProject length:",
    allCharactersForProject.length
  );
  console.log("[OutlineSection] isLoadingAllChars:", isLoadingAllChars);

  // New state for Outline Creator modal and loading
  const [isOutlineCreatorModalOpen, setIsOutlineCreatorModalOpen] =
    useState(false);
  const [isGeneratingFullOutline, setIsGeneratingFullOutline] = useState(false);

  // Handler for generating full outline with AI
  const handleGenerateFullOutline = async () => {
    if (!currentProjectDetails?.one_page_synopsis?.trim()) {
      toast.error(
        "A 'One Page Synopsis' is required to generate an outline. Please add one in the Synopsis tab."
      );
      setIsOutlineCreatorModalOpen(false);
      return;
    }

    setIsGeneratingFullOutline(true);
    setIsOutlineCreatorModalOpen(false);
    const toastId = toast.loading(
      "Generating full outline with AI... This may take a few minutes."
    );

    try {
      const parsedData = await generateAndParseOutline(initialProject.id);

      if (parsedData) {
        toast.info(
          "AI has generated the outline structure. Now creating database entries...",
          { id: toastId }
        );

        if (allSceneTags.length === 0 && !isLoadingAllSceneTags) {
          await refreshAllSceneTags();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await createEntitiesFromOutline(
          initialProject.id,
          parsedData,
          allSceneTags
        );

        toast.success("Full outline created successfully!", { id: toastId });

        fetchProjectChapters();
        fetchAllChars();
      } else {
        toast.error(
          "Failed to generate or parse outline data from AI. No changes made.",
          {
            id: toastId,
          }
        );
      }
    } catch (error) {
      console.error("Error during full outline generation process:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during outline generation.",
        { id: toastId }
      );
    } finally {
      setIsGeneratingFullOutline(false);
    }
  };

  // Render the OutlineCreatorModal component
  const renderOutlineCreatorModal = () => (
    <OutlineCreatorModal
      isOpen={isOutlineCreatorModalOpen}
      onClose={() => setIsOutlineCreatorModalOpen(false)}
      onConfirm={handleGenerateFullOutline}
      isLoading={isGeneratingFullOutline}
      hasExistingContent={
        chapters.length > 0 || allCharactersForProject.length > 0
      }
    />
  );

  const middleColumnContent = (
    <>
      <ContextualHeader
        title="Outline Sections"
        navControls={
          <IconButton
            icon={Sparkles}
            aria-label="Generate Full Outline with AI"
            onClick={() => setIsOutlineCreatorModalOpen(true)}
            disabled={isGeneratingFullOutline}
            title="AI Outline Creator"
          />
        }
      />
      <ListContainer>
        <ListItem
          title="Synopsis"
          icon={FileText}
          onClick={() => setOutlineView("synopsis")}
          isSelected={outlineView === "synopsis"}
        />
        <ListItem
          title="Scenes"
          icon={ClipboardList}
          onClick={() => setOutlineView("scenes")}
          isSelected={outlineView === "scenes"}
        />
      </ListContainer>
    </>
  );

  // Remove unused handleSceneUpdateFromOutlineList since we're using handleSceneUpdate now

  const mainDetailColumnContent = (
    <>
      {outlineView === "synopsis" ? (
        <div className="p-1">
          <ProjectSynopsisEditor
            project={{
              id: currentProjectDetails.id,
              log_line: currentProjectDetails.log_line,
              one_page_synopsis: currentProjectDetails.one_page_synopsis,
              title: currentProjectDetails.title,
              genre_id: currentProjectDetails.genre_id,
            }}
            projectGenreName={currentProjectDetails.genre}
            sceneOutlineDescriptions={(() => {
              let allSceneOutlineDescriptions = "";
              if (chapters && chapters.length > 0) {
                const descriptionsArray: string[] = [];
                chapters.forEach((chapter) => {
                  if (Array.isArray(chapter.scenes)) {
                    chapter.scenes.forEach((scene) => {
                      if (
                        scene.outline_description &&
                        scene.outline_description.trim() !== ""
                      ) {
                        const sceneTitlePrefix = scene.title
                          ? `Scene (${scene.title}): `
                          : "Scene: ";
                        descriptionsArray.push(
                          sceneTitlePrefix + scene.outline_description
                        );
                      }
                    });
                  }
                });
                if (descriptionsArray.length > 0) {
                  allSceneOutlineDescriptions =
                    "Existing Scene Outline Descriptions:\n" +
                    descriptionsArray.join("\n\n");
                }
              }
              return allSceneOutlineDescriptions;
            })()}
            onSynopsisUpdate={(data) => {
              const safeData = {
                log_line: data.log_line ?? "",
                one_page_synopsis: data.one_page_synopsis ?? "",
              };
              handleSynopsisUpdate(safeData);
            }}
          />
          <div className="p-4">
            <div className="mb-6">
              <Button
                onClick={() => setIsOutlineCreatorModalOpen(true)}
                disabled={
                  isGeneratingFullOutline ||
                  !currentProjectDetails?.one_page_synopsis?.trim()
                }
                className="w-full"
                size="lg"
              >
                {isGeneratingFullOutline ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Full Outline with AI
                  </>
                )}
              </Button>
              {!currentProjectDetails?.one_page_synopsis?.trim() && (
                <Paragraph className="text-sm text-muted-foreground mt-2 text-center">
                  Add a one-page synopsis above to enable AI outline generation
                </Paragraph>
              )}
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-2">
              Character Quick View
            </h3>
            {isLoadingAllChars && allCharactersForProject.length === 0 ? (
              <Paragraph className="text-sm text-muted-foreground italic">
                Loading characters...
              </Paragraph>
            ) : (
              <CharacterCardQuickViewList
                characters={allCharactersForProject}
              />
            )}
          </div>
        </div>
      ) : outlineView === "scenes" ? (
        <div className="p-1 h-full">
          {isLoadingOutline && chapters.length === 0 ? (
            <Paragraph className="p-4 text-sm text-muted-foreground">
              Loading outline data...
            </Paragraph>
          ) : (
            <ChapterSceneOutlineList
              chapters={chapters}
              characters={allCharactersForProject}
              sceneTags={allSceneTags}
              projectId={initialProject.id}
              onSceneUpdate={handleSceneUpdate}
            />
          )}
        </div>
      ) : null}
    </>
  );

  if (!isActive) return null;

  // Include the modal in the component's return
  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />
      {renderOutlineCreatorModal()}
    </>
  );
}
