// components/dashboard/sections/OutlineSection/index.tsx
import React, { useState, useCallback, useRef } from "react";
import type { Project, Scene } from "@/lib/types";
import { useOutlineData } from "@/hooks/dashboard/useOutlineData";
import { useManuscriptData } from "@/hooks/dashboard/useManuscriptData";
import { useCharactersData } from "@/hooks/dashboard/useCharactersData";
import { useProjectData } from "@/contexts/ProjectDataContext";

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
  project: Project;
}

export function OutlineSection({
  project: initialProject,
}: OutlineSectionProps) {
  const [outlineView, setOutlineView] = React.useState<OutlineView>("synopsis");
  const hasInitialChaptersFetchCompleted = useRef(false);
  const hasInitialCharactersFetchCompleted = useRef(false);

  const {
    project: currentProjectDetails,
    chapters,
    isLoading: isLoadingOutline,
    handleSynopsisUpdate,
    handleSceneOutlineUpdate: hookHandleSceneOutlineUpdate,
  } = useOutlineData(initialProject, initialProject.id);

  const {
    allSceneTags,
    isLoadingAllSceneTags,
    refreshAllSceneTags,
    triggerSceneUpdate,
  } = useProjectData();

  const { fetchProjectChapters } = useManuscriptData(initialProject.id);

  const handleSceneUpdate = useCallback(
    async (chapterId: string, sceneId: string, updatedData: Partial<Scene>) => {
      const updatedScene = await hookHandleSceneOutlineUpdate(
        chapterId,
        sceneId,
        updatedData
      );
      if (updatedScene) triggerSceneUpdate();
    },
    [hookHandleSceneOutlineUpdate, triggerSceneUpdate]
  );

  const {
    characters: allCharactersForProject,
    fetchProjectCharacters: fetchAllChars,
    isLoadingCharactersData: isLoadingAllChars,
  } = useCharactersData(initialProject.id);

  React.useEffect(() => {
    // Chapters fetch with ref protection
    if (
      outlineView === "scenes" &&
      chapters.length === 0 &&
      !isLoadingOutline &&
      !hasInitialChaptersFetchCompleted.current
    ) {
      hasInitialChaptersFetchCompleted.current = true;
      fetchProjectChapters();
    }

    // Characters fetch with ref protection
    if (
      outlineView === "synopsis" &&
      allCharactersForProject.length === 0 &&
      !isLoadingAllChars &&
      !hasInitialCharactersFetchCompleted.current
    ) {
      hasInitialCharactersFetchCompleted.current = true;
      fetchAllChars();
    }
  }, [
    outlineView,
    chapters.length,
    isLoadingOutline,
    fetchProjectChapters,
    allCharactersForProject.length,
    isLoadingAllChars,
    fetchAllChars,
  ]);

  // Reset refs when project changes
  React.useEffect(() => {
    hasInitialChaptersFetchCompleted.current = false;
    hasInitialCharactersFetchCompleted.current = false;
  }, [initialProject.id]);

  const [isOutlineCreatorModalOpen, setIsOutlineCreatorModalOpen] =
    useState(false);
  const [isGeneratingFullOutline, setIsGeneratingFullOutline] = useState(false);

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
              onSceneCreated={triggerSceneUpdate}
            />
          )}
        </div>
      ) : null}
    </>
  );

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
