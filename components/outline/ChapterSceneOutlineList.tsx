"use client";

import React, { useState, useEffect } from "react";
import type {
  Chapter,
  Scene,
  Character,
  SceneTag,
  PrimarySceneCategory,
} from "@/lib/types";
import { ALL_PRIMARY_SCENE_CATEGORIES } from "@/lib/types";
import { ListContainer } from "@/components/ui/ListContainer";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import {
  Loader2,
  Sparkles,
  Edit3,
  Save,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Users,
  Tag,
  BookOpen,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { chat } from "@/lib/data/chat";
import { getToolModelByName } from "@/lib/data/toolModels";
import { getSystemPromptByCategory } from "@/lib/data/aiPrompts";
import type { TextBlock, ChatResponse } from "snowgander";
import { ManageSceneCharactersModal } from "@/components/modals/ManageSceneCharactersModal";
import { ManageSceneTagsModal } from "@/components/modals/ManageSceneTagsModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal";
import { updateSceneCharacters, updateSceneTags } from "@/lib/data/scenes";
import { useProjectData } from "@/contexts/ProjectDataContext";

interface ChapterSceneOutlineListProps {
  chapters: Chapter[];
  characters: Character[];
  sceneTags: SceneTag[];
  projectId: string;
  onSceneUpdate: (
    chapterId: string,
    sceneId: string,
    updatedData: Partial<Scene>
  ) => Promise<void>;
  onSceneCreated: () => void;
}

// Scene category color mapping
const getCategoryColor = (category: string | null) => {
  const colors = {
    Action: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Dialog: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Exposition:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Reaction:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    Sequel:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Transition:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return (
    colors[category as keyof typeof colors] ||
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  );
};

export function ChapterSceneOutlineList({
  chapters,
  characters,
  sceneTags,
  projectId,
  onSceneUpdate,
  onSceneCreated,
}: ChapterSceneOutlineListProps) {
  const { triggerSceneUpdate } = useProjectData();
  console.log("ChapterSceneOutlineList - Props Received:");
  console.log("Chapters:", chapters);
  console.log("Characters (allProjectCharacters):", characters);
  console.log("SceneTags:", sceneTags);

  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Scene>>({});
  const [isGeneratingOutline, setIsGeneratingOutline] = useState<string | null>(
    null
  );

  // Modal states
  const [isManageCharsModalOpen, setIsManageCharsModalOpen] = useState(false);
  const [managingCharsForScene, setManagingCharsForScene] =
    useState<Scene | null>(null);
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);
  const [managingTagsForScene, setManagingTagsForScene] =
    useState<Scene | null>(null);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);
  const [creatingSceneInChapterId, setCreatingSceneInChapterId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setExpandedChapters(new Set(chapters.map((chapter) => chapter.id)));
    } else {
      setExpandedChapters(new Set());
    }
  }, [chapters]);

  const handleGenerateSceneOutlineDescription = async (scene: Scene) => {
    if (!scene.id) {
      toast.error("Scene ID is missing.");
      return;
    }

    const sceneTitle = scene.title || "Untitled Scene";
    const sceneContent = scene.content || "";

    if (!sceneTitle && !sceneContent) {
      toast.info(
        "Please provide a scene title or some content before generating an outline description."
      );
      return;
    }

    setIsGeneratingOutline(scene.id);
    try {
      const toolName = "scene_outliner";

      const toolModelConfig = await getToolModelByName(toolName);
      if (!toolModelConfig || !toolModelConfig.model_id) {
        console.error(
          `AI model configuration for '${toolName}' not found or model_id is missing.`
        );
        throw new Error(
          `AI model configuration for '${toolName}' not found or incomplete.`
        );
      }
      const modelId = toolModelConfig.model_id;

      const systemPromptText = await getSystemPromptByCategory(toolName);
      if (!systemPromptText) {
        console.error(`System prompt for '${toolName}' not found.`);
        throw new Error(
          `System prompt for '${toolName}' not found. Please ensure it's configured.`
        );
      }

      let userPrompt = `Generate an outline description for the following scene.\n\n`;
      if (sceneTitle) {
        userPrompt += `Scene Title: ${sceneTitle}\n`;
      }
      if (sceneContent) {
        userPrompt += `Scene Content (excerpt):\n${sceneContent}\n\n`;
      }
      userPrompt += `Return only the outline description itself, as plain text, without any additional formatting or conversational text.`;

      const aiResponse: ChatResponse = await chat(
        modelId,
        [],
        userPrompt,
        systemPromptText
      );

      if (aiResponse && aiResponse.content && aiResponse.content.length > 0) {
        const firstTextBlock = aiResponse.content.find(
          (block) => block.type === "text"
        ) as TextBlock | undefined;

        if (firstTextBlock && typeof firstTextBlock.text === "string") {
          let generatedDescription = firstTextBlock.text.trim();
          generatedDescription = generatedDescription
            .replace(/^description:/i, "")
            .trim();
          generatedDescription = generatedDescription
            .replace(/^here's the description:/i, "")
            .trim();
          generatedDescription = generatedDescription
            .replace(/^"|"$/g, "")
            .trim();

          setEditFormData((prev) => ({
            ...prev,
            outline_description: generatedDescription,
          }));
          toast.success("Scene outline description generated!");
        } else {
          const errorBlock = aiResponse.content.find(
            (block) => block.type === "error"
          );
          let errorMessage =
            "AI response was empty or not in the expected text format.";
          if (
            errorBlock &&
            "publicMessage" in errorBlock &&
            typeof errorBlock.publicMessage === "string"
          ) {
            errorMessage = errorBlock.publicMessage;
          }
          console.error("AI response error or unexpected format:", aiResponse);
          throw new Error(errorMessage);
        }
      } else {
        console.error(
          "AI returned an empty or invalid response structure:",
          aiResponse
        );
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error("Error generating scene outline description:", error);
      const displayMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate description.";
      toast.error(displayMessage);
    } finally {
      setIsGeneratingOutline(null);
    }
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  if (!chapters || chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="relative">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-6" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <PlusCircle className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h3 className="font-serif text-xl font-medium text-slate-700 dark:text-slate-300 mb-3">
          No chapters found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          Add chapters in the Manuscript section first, or create them here to
          get started with your outline.
        </p>
      </div>
    );
  }

  return (
    <>
      <ListContainer className="h-full overflow-y-auto">
        <div className="space-y-6 p-4">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Chapter Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleChapterExpansion(chapter.id)}
                      aria-expanded={expandedChapters.has(chapter.id)}
                      aria-controls={`chapter-scenes-${chapter.id}`}
                      className="p-2 h-auto hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {expandedChapters.has(chapter.id) ? (
                        <ChevronDown
                          size={20}
                          className="text-slate-600 dark:text-slate-400"
                        />
                      ) : (
                        <ChevronRight
                          size={20}
                          className="text-slate-600 dark:text-slate-400"
                        />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {chapter.title || "Untitled Chapter"}
                      </h2>
                      {chapter.scenes && chapter.scenes.length > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {chapter.scenes.length} scene
                          {chapter.scenes.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCreatingSceneInChapterId(chapter.id);
                      setIsCreateSceneModalOpen(true);
                    }}
                    title="Add Scene to Chapter"
                    className="p-2 h-auto hover:bg-primary/10 text-primary hover:text-primary rounded-lg transition-colors"
                  >
                    <PlusCircle size={18} />
                  </Button>
                </div>

                {/* Chapter Progress Bar 
                {chapter.scenes && chapter.scenes.length > 0 && (
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (chapter.scenes.filter((s) => s.outline_description)
                            .length /
                            chapter.scenes.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                )}
                */}
              </div>

              {/* Scenes List */}
              {expandedChapters.has(chapter.id) && (
                <div id={`chapter-scenes-${chapter.id}`} className="px-6 pb-6">
                  {chapter.scenes && chapter.scenes.length > 0 ? (
                    <div className="space-y-4">
                      {chapter.scenes
                        .sort((a, b) => a.order - b.order)
                        .map((scene, index) => (
                          <div
                            key={scene.id}
                            className={`group relative p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                              editingSceneId === scene.id
                                ? "border-primary shadow-sm"
                                : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                            }`}
                          >
                            {/* Scene Number Badge */}
                            <div className="absolute -left-3 top-4 p-1 w-6 h-6 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-sm">
                              {index + 1}
                            </div>

                            <div className="p-5 pl-8">
                              {/* Scene Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-1 truncate">
                                    {scene.title || "Untitled Scene"}
                                  </h4>
                                  {scene.primary_category && (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                                        scene.primary_category
                                      )}`}
                                    >
                                      {scene.primary_category}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSceneId(scene.id);
                                    setEditFormData({
                                      id: scene.id,
                                      outline_description:
                                        scene.outline_description || "",
                                      pov_character_id:
                                        scene.pov_character_id || null,
                                      primary_category:
                                        scene.primary_category || null,
                                    });
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 h-auto"
                                >
                                  <Edit3 size={14} className="mr-1.5" />
                                  Edit
                                </Button>
                                <Link
                                  href={`/project/${projectId}?section=manuscript&chapterId=${chapter.id}&sceneId=${scene.id}`}
                                  passHref
                                >
                                  <IconButton
                                    asChild
                                    icon={BookOpen}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Go to Manuscript"
                                    title="Go to Manuscript"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-auto"
                                    onClick={(e: React.MouseEvent) =>
                                      e.stopPropagation()
                                    }
                                  />
                                </Link>
                              </div>

                              {/* Scene Description */}
                              <div className="mb-4">
                                {scene.outline_description ? (
                                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {scene.outline_description}
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    No outline description yet.
                                  </p>
                                )}
                              </div>

                              {/* Scene Metadata */}
                              <div className="flex flex-wrap gap-3 text-xs">
                                {/* POV Character */}
                                <div className="flex items-center space-x=1.5 text-slate-600 dark:text-slate-400">
                                  <User size={14} />
                                  <span className="font-medium">POV:</span>
                                  <span>
                                    {characters.find(
                                      (c) => c.id === scene.pov_character_id
                                    )?.name || (
                                      <span className="italic text-slate-500">
                                        Not set
                                      </span>
                                    )}
                                  </span>
                                </div>

                                {/* Other Characters */}
                                {scene.other_character_ids &&
                                  scene.other_character_ids.length > 0 && (
                                    <div className="flex items-center space-x=1.5 text-slate-600 dark:text-slate-400">
                                      <Users size={14} />
                                      <span className="font-medium">
                                        Characters:
                                      </span>
                                      <span>
                                        {scene.other_character_ids
                                          .map(
                                            (charId) =>
                                              characters.find(
                                                (c) => c.id === charId
                                              )?.name
                                          )
                                          .filter((name) => !!name)
                                          .join(", ")}
                                      </span>
                                    </div>
                                  )}

                                {/* Tags */}
                                {scene.tag_ids && scene.tag_ids.length > 0 && (
                                  <div className="flex items-center space-x=1.5 text-slate-600 dark:text-slate-400">
                                    <Tag size={14} />
                                    <span className="font-medium">Tags:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {scene.tag_ids
                                        .map(
                                          (tagId) =>
                                            sceneTags.find(
                                              (t) => t.id === tagId
                                            )?.name
                                        )
                                        .filter((name) => !!name)
                                        .map((tagName, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md text-xs"
                                          >
                                            {tagName}
                                          </span>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Edit Form */}
                              {editingSceneId === scene.id && (
                                <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 space-y-4">
                                  {/* Outline Description */}
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                      Outline Description
                                    </label>
                                    <Textarea
                                      value={
                                        editFormData.outline_description || ""
                                      }
                                      onChange={(e) =>
                                        setEditFormData((prev) => ({
                                          ...prev,
                                          outline_description: e.target.value,
                                        }))
                                      }
                                      rows={4}
                                      className="text-sm resize-none"
                                      disabled={
                                        isGeneratingOutline === scene.id
                                      }
                                      placeholder="Describe what happens in this scene..."
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt=2 text-xs text-primary hover:text-primary/90 px=0"
                                      onClick={() =>
                                        handleGenerateSceneOutlineDescription(
                                          scene
                                        )
                                      }
                                      disabled={
                                        isGeneratingOutline === scene.id
                                      }
                                    >
                                      {isGeneratingOutline === scene.id ? (
                                        <Loader2 className="w=3 h=3 mr=1.5 animate=spin" />
                                      ) : (
                                        <Sparkles className="w=3 h=3 mr=1.5" />
                                      )}
                                      {isGeneratingOutline === scene.id
                                        ? "Generating..."
                                        : "Generate with AI"}
                                    </Button>
                                  </div>

                                  {/* Form Row 1 */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* POV Character */}
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        POV Character
                                      </label>
                                      <select
                                        value={
                                          editFormData.pov_character_id || ""
                                        }
                                        onChange={(e) =>
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            pov_character_id:
                                              e.target.value || null,
                                          }))
                                        }
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                      >
                                        <option value="">
                                          Select POV Character
                                        </option>
                                        {characters.map((char) => (
                                          <option key={char.id} value={char.id}>
                                            {char.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Primary Category */}
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Primary Category
                                      </label>
                                      <select
                                        value={
                                          editFormData.primary_category || ""
                                        }
                                        onChange={(e) =>
                                          setEditFormData((prev) => ({
                                            ...prev,
                                            primary_category:
                                              (e.target
                                                .value as PrimarySceneCategory) ||
                                              null,
                                          }))
                                        }
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                      >
                                        <option value="">
                                          Select Category
                                        </option>
                                        {ALL_PRIMARY_SCENE_CATEGORIES.map(
                                          (cat) => (
                                            <option key={cat} value={cat}>
                                              {cat}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Form Row 2 */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Manage Characters */}
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Other Characters
                                      </label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-center"
                                        onClick={() => {
                                          setManagingCharsForScene(scene);
                                          setIsManageCharsModalOpen(true);
                                        }}
                                      >
                                        <Users size={14} className="mr-2" />
                                        Manage Characters
                                      </Button>
                                    </div>

                                    {/* Manage Tags */}
                                    <div>
                                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Scene Tags
                                      </label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-center"
                                        onClick={() => {
                                          setManagingTagsForScene(scene);
                                          setIsManageTagsModalOpen(true);
                                        }}
                                      >
                                        <Tag size={14} className="mr-2" />
                                        Manage Tags
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex justify-end space-x-3 pt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingSceneId(null);
                                        setEditFormData({});
                                      }}
                                      className="px-4"
                                    >
                                      <X size={14} className="mr-1.5" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        onSceneUpdate(
                                          chapter.id,
                                          scene.id,
                                          editFormData
                                        );
                                        setEditingSceneId(null);
                                        setEditFormData({});
                                      }}
                                      className="px-4"
                                    >
                                      <Save size={14} className="mr-1.5" />
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PlusCircle className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        No scenes in this chapter yet
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCreatingSceneInChapterId(chapter.id);
                          setIsCreateSceneModalOpen(true);
                        }}
                      >
                        <PlusCircle size={14} className="mr-2" />
                        Add First Scene
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ListContainer>

      {/* Modals */}
      {managingCharsForScene && isManageCharsModalOpen && (
        <ManageSceneCharactersModal
          isOpen={isManageCharsModalOpen}
          onClose={() => {
            setIsManageCharsModalOpen(false);
            setManagingCharsForScene(null);
          }}
          allProjectCharacters={characters}
          currentSceneCharacterIds={
            managingCharsForScene?.other_character_ids || []
          }
          projectId={projectId}
          sceneId={managingCharsForScene?.id || ""}
          onSave={async (sceneId, selectedCharacterIds) => {
            try {
              await updateSceneCharacters(
                projectId,
                sceneId,
                selectedCharacterIds
              );
              triggerSceneUpdate();
              toast.success("Other characters updated successfully.");
            } catch (error: unknown) {
              console.error("Failed to update scene characters:", error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not update other characters."
              );
            }
          }}
          sceneTitle={managingCharsForScene?.title || "Untitled Scene"}
        />
      )}

      {managingTagsForScene && isManageTagsModalOpen && (
        <ManageSceneTagsModal
          isOpen={isManageTagsModalOpen}
          onClose={() => {
            setIsManageTagsModalOpen(false);
            setManagingTagsForScene(null);
          }}
          allProjectSceneTags={sceneTags}
          currentSceneTagIds={managingTagsForScene?.tag_ids || []}
          projectId={projectId}
          sceneId={managingTagsForScene?.id || ""}
          onSave={async (sceneId, selectedTagIds) => {
            try {
              await updateSceneTags(projectId, sceneId, selectedTagIds);
              triggerSceneUpdate();
              toast.success("Scene tags updated successfully.");
            } catch (error: unknown) {
              console.error("Failed to update scene tags:", error);
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not update scene tags."
              );
            }
          }}
          sceneTitle={managingTagsForScene?.title || "Untitled Scene"}
        />
      )}

      {isCreateSceneModalOpen && creatingSceneInChapterId && (
        <CreateSceneModal
          projectId={projectId}
          chapterId={creatingSceneInChapterId}
          isOpen={isCreateSceneModalOpen}
          onClose={() => {
            setIsCreateSceneModalOpen(false);
            setCreatingSceneInChapterId(null);
          }}
          onSceneCreated={() => {
            onSceneCreated();
            setIsCreateSceneModalOpen(false);
            setCreatingSceneInChapterId(null);
          }}
        />
      )}
    </>
  );
}
