// components/dashboard/sections/OutlineSection/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { Project, Scene } from "@/lib/types";
import { useOutlineData } from "@/hooks/dashboard/useOutlineData";
import { useManuscriptData } from "@/hooks/dashboard/useManuscriptData"; // For chapters & scenes
import { useCharactersData } from "@/hooks/dashboard/useCharactersData"; // For characters list
import { useProjectData } from "@/contexts/ProjectDataContext"; // For allSceneTags

import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { FileText, ClipboardList } from "lucide-react";
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
import { Loader2, Sparkles } from "lucide-react";

type OutlineView = "synopsis" | "scenes";

interface OutlineSectionProps {
  project: Project; // The full initial project object
  isActive: boolean;
}

export function OutlineSection({
  project: initialProject,
  isActive,
}: OutlineSectionProps) {
  const {
    currentProjectDetails,
    setCurrentProjectDetails,
    handleSynopsisUpdate,
    handleSceneOutlineUpdate: hookHandleSceneOutlineUpdate,
  } = useOutlineData(initialProject, initialProject.id);

  // Use manuscript data hook for chapters and scenes
  const {
    chapters,
    fetchProjectChapters,
    isLoadingChapters,
    setChapters,
    setSelectedScene,
    setScenesForSelectedChapter,
    selectedChapter,
  } = useManuscriptData(initialProject.id);
  // Use characters data hook for character list
  const {
    characters: allCharactersForProject,
    fetchProjectCharacters: fetchAllChars,
    isLoadingCharactersData: isLoadingAllChars,
  } = useCharactersData(initialProject.id);
  // Use project data context for all scene tags
  const { allSceneTags, isLoadingAllSceneTags, refreshAllSceneTags } =
    useProjectData();

  const [outlineView, setOutlineView] = useState<OutlineView>("synopsis");
  const [charactersFetchAttempted, setCharactersFetchAttempted] =
    useState(false);

  // New state for Outline Creator modal and loading
  const [isOutlineCreatorModalOpen, setIsOutlineCreatorModalOpen] =
    useState(false);
  const [isGeneratingFullOutline, setIsGeneratingFullOutline] = useState(false);

  useEffect(() => {
    if (isActive) {
      setCurrentProjectDetails(initialProject); // Ensure local project details are fresh
      // Fetch necessary data based on the current outline view
      if (
        outlineView === "scenes" &&
        chapters.length === 0 &&
        !isLoadingChapters
      ) {
        fetchProjectChapters();
      }
      if (
        (outlineView === "synopsis" || outlineView === "scenes") &&
        allCharactersForProject.length === 0 &&
        !isLoadingAllChars &&
        !charactersFetchAttempted
      ) {
        fetchAllChars().finally(() => setCharactersFetchAttempted(true));
      }
      if (
        outlineView === "scenes" &&
        allSceneTags.length === 0 &&
        !isLoadingAllSceneTags
      ) {
        refreshAllSceneTags(); // From context
      }
    } else {
      setOutlineView("synopsis"); // Reset view when section becomes inactive
    }
  }, [
    isActive,
    outlineView,
    initialProject,
    setCurrentProjectDetails,
    fetchProjectChapters,
    chapters.length,
    isLoadingChapters,
    fetchAllChars,
    allCharactersForProject.length,
    isLoadingAllChars,
    refreshAllSceneTags,
    allSceneTags.length,
    isLoadingAllSceneTags,
    charactersFetchAttempted,
  ]);

  useEffect(() => {
    setCharactersFetchAttempted(false);
  }, [initialProject.id]);

  // Handler passed to ChapterSceneOutlineList for when a scene's core fields are updated
  // This updates the master list of chapters in useManuscriptData
  const handleSceneUpdateFromOutlineList = useCallback(
    async (chapterId: string, sceneId: string, updatedData: Partial<Scene>) => {
      const updatedScene = await hookHandleSceneOutlineUpdate(
        chapterId,
        sceneId,
        updatedData
      );
      if (updatedScene) {
        setChapters((prevChapters) =>
          prevChapters.map((ch) => {
            if (ch.id === chapterId) {
              return {
                ...ch,
                scenes: (ch.scenes || []).map((sc) =>
                  sc.id === sceneId ? { ...sc, ...updatedScene } : sc
                ),
              };
            }
            return ch;
          })
        );
        // If this scene is also the globally selected scene in Manuscript, update it there too
        setSelectedScene((prev) =>
          prev && prev.id === sceneId ? { ...prev, ...updatedScene } : prev
        );
        // Only update scenes for the selected chapter in OutlineSection's context
        if (selectedChapter && selectedChapter.id === chapterId) {
          setScenesForSelectedChapter((prevScenes) =>
            prevScenes.map((s) =>
              s.id === sceneId ? { ...s, ...updatedScene } : s
            )
          );
        }
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

  if (!isActive) return null;

  const renderOutlineSynopsisView = () => {
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

    return (
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Project Synopses</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Edit your project&apos;s high-level summaries.
          </p>
          <ProjectSynopsisEditor
            project={{
              id: currentProjectDetails.id,
              log_line: currentProjectDetails.log_line,
              one_page_synopsis: currentProjectDetails.one_page_synopsis,
              title: currentProjectDetails.title,
              genre_id: currentProjectDetails.genre_id,
            }}
            projectGenreName={currentProjectDetails.genre}
            sceneOutlineDescriptions={allSceneOutlineDescriptions}
            onSynopsisUpdate={(data) => {
              const safeData = {
                log_line: data.log_line ?? "",
                one_page_synopsis: data.one_page_synopsis ?? "",
              };
              handleSynopsisUpdate(safeData).then((updatedProject) => {
                if (updatedProject) setCurrentProjectDetails(updatedProject);
              });
            }}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">
            Character Quick View
          </h3>
          {isLoadingAllChars && allCharactersForProject.length === 0 ? (
            <Paragraph className="text-sm text-muted-foreground italic">
              Loading characters...
            </Paragraph>
          ) : (
            <CharacterCardQuickViewList characters={allCharactersForProject} />
          )}
        </div>
      </div>
    );
  };

  const renderOutlineScenesView = () => {
    if (isLoadingChapters && chapters.length === 0) {
      return (
        <Paragraph className="p-4 text-sm text-muted-foreground">
          Loading outline data...
        </Paragraph>
      );
    }
    return (
      <ChapterSceneOutlineList
        chapters={chapters}
        characters={allCharactersForProject}
        sceneTags={allSceneTags}
        projectId={initialProject.id}
        onSceneUpdate={handleSceneUpdateFromOutlineList}
      />
    );
  };

  const middleColumnContent = (
    <>
      <ContextualHeader title="Outline Sections" />
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
      {outlineView === "synopsis" && renderOutlineSynopsisView()}
      {outlineView === "scenes" && renderOutlineScenesView()}
    </>
  );

  return (
    <SecondaryViewLayout
      middleColumn={middleColumnContent}
      mainDetailColumn={mainDetailColumnContent}
    />
  );
}
