"use client";
import React, { useState, useCallback } from "react";
import type { Project, Scene } from "@/lib/types";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { FileText, ClipboardList, Sparkles } from "lucide-react";
import { ProjectSynopsisEditor } from "@/components/outline/ProjectSynopsisEditor";
import { CharacterCardQuickViewList } from "@/components/outline/CharacterCardQuickViewList";
import { ChapterSceneOutlineList } from "@/components/outline/ChapterSceneOutlineList";
import { Paragraph } from "@/components/typography/Paragraph";
import { OutlineCreatorModal } from "@/components/outline/OutlineCreatorModal";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type OutlineView = "synopsis" | "scenes";

interface OutlineSectionProps {
  project: Project;
}

export function OutlineSection({
  project: initialProject,
}: OutlineSectionProps) {
  const [outlineView, setOutlineView] = useState<OutlineView>("synopsis");
  const [isOutlineCreatorModalOpen, setIsOutlineCreatorModalOpen] =
    useState(false);

  const { project, chapters, characters, sceneTags, isLoading } =
    useProjectStore(
      useShallow((state) => ({
        project: state.project,
        chapters: state.chapters,
        characters: state.characters,
        sceneTags: state.sceneTags,
        isLoading: state.isLoading,
      }))
    );

  // 2. Select all actions individually
  const updateProjectDetails = useProjectStore(
    (state) => state.updateProjectDetails
  );
  const generateAIFullOutline = useProjectStore(
    (state) => state.generateAIFullOutline
  );
  const fetchChapters = useProjectStore((state) => state.fetchChapters);
  const updateScene = useProjectStore((state) => state.updateScene);

  const handleSceneUpdate = useCallback(
    async (chapterId: string, sceneId: string, updatedData: Partial<Scene>) => {
      await updateScene(chapterId, sceneId, {
        title: updatedData.title ?? undefined,
        content: updatedData.content ?? undefined,
        order: updatedData.order,
        outline_description: updatedData.outline_description,
        pov_character_id: updatedData.pov_character_id,
        primary_category: updatedData.primary_category,
        // Transform complex properties to match the schema
        tag_ids: updatedData.scene_applied_tags?.map((t) => t.tag_id),
        other_character_ids: updatedData.scene_characters?.map(
          (c) => c.character_id
        ),
      });
    },
    [updateScene]
  );

  const handleSceneCreated = useCallback(async () => {
    await fetchChapters();
  }, [fetchChapters]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const middleColumnContent = (
    <>
      <ContextualHeader
        title="Outline"
        navControls={
          <IconButton
            icon={Sparkles}
            aria-label="Generate Full Outline with AI"
            onClick={() => setIsOutlineCreatorModalOpen(true)}
            disabled={isLoading.generatingOutline}
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
              id: project.id,
              log_line: project.log_line,
              one_page_synopsis: project.one_page_synopsis,
              title: project.title,
              genre_id: project.genre_id,
            }}
            projectGenreName={
              project.genre &&
              typeof project.genre === "object" &&
              "name" in project.genre
                ? (project.genre as { name: string }).name
                : typeof project.genre === "string"
                ? project.genre
                : ""
            }
            sceneOutlineDescriptions={(() => {
              let allSceneOutlineDescriptions = "";
              if (chapters && chapters.length > 0) {
                const descriptionsArray: string[] = [];
                chapters.forEach((chapter) => {
                  if (Array.isArray(chapter.scenes)) {
                    chapter.scenes.forEach((scene) => {
                      if (scene.outline_description?.trim()) {
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
            onSynopsisUpdate={updateProjectDetails}
          />
          <div className="p-4">
            <div className="mb-6">
              <Button
                onClick={() => setIsOutlineCreatorModalOpen(true)}
                disabled={
                  isLoading.generatingOutline ||
                  !project.one_page_synopsis?.trim()
                }
                className="w-full"
                size="lg"
              >
                {isLoading.generatingOutline ? (
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
              {!project.one_page_synopsis?.trim() && (
                <Paragraph className="text-sm text-muted-foreground mt-2 text-center">
                  Add a one-page synopsis above to enable AI outline generation
                </Paragraph>
              )}
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-2">
              Character Quick View
            </h3>
            {isLoading.characters && characters.length === 0 ? (
              <Paragraph className="text-sm text-muted-foreground italic">
                Loading characters...
              </Paragraph>
            ) : (
              <CharacterCardQuickViewList characters={characters} />
            )}
          </div>
        </div>
      ) : outlineView === "scenes" ? (
        <div className="p-1 h-full">
          {isLoading.chapters && chapters.length === 0 ? (
            <Paragraph className="p-4 text-sm text-muted-foreground">
              Loading outline data...
            </Paragraph>
          ) : (
            <ChapterSceneOutlineList
              chapters={chapters}
              characters={characters}
              sceneTags={sceneTags}
              projectId={project.id}
              onSceneUpdate={handleSceneUpdate}
              onSceneCreated={handleSceneCreated}
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
      <OutlineCreatorModal
        isOpen={isOutlineCreatorModalOpen}
        onClose={() => setIsOutlineCreatorModalOpen(false)}
        onConfirm={generateAIFullOutline}
        isLoading={isLoading.generatingOutline}
        hasExistingContent={chapters.length > 0 || characters.length > 0}
      />
    </>
  );
}
