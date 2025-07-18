import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { extractJsonFromString } from "@/lib/utils";

import type { Scene, Character, PrimarySceneCategory } from "@/lib/types";
import { ALL_PRIMARY_SCENE_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import { Textarea } from "@/components/ui/Textarea";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import { ManageSceneCharactersModal } from "@/components/modals/ManageSceneCharactersModal";
import { ManageSceneTagsModal } from "@/components/modals/ManageSceneTagsModal";
import { X, Edit3, Save, Sparkles, Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/ai/AISMessageHandler";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";

export interface SceneMetadataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene;
  projectId: string;
  onSceneUpdate: (
    updatedData: Partial<
      Pick<
        Scene,
        "outline_description" | "pov_character_id" | "primary_category"
      >
    >
  ) => Promise<void>;
  onCharacterLinkChange: (
    characterIds: Array<{ character_id: string }>
  ) => Promise<void>;
  onTagLinkChange: (tagIds: Array<{ tag_id: string }>) => Promise<void>;
  className?: string;
}

export function SceneMetadataPanel({
  isOpen,
  onClose,
  scene,
  projectId,
  onSceneUpdate,
  onCharacterLinkChange,
  onTagLinkChange,
  className,
}: SceneMetadataPanelProps) {
  const { allProjectCharacters, allProjectSceneTags } = useProjectStore(
    useShallow((state) => ({
      allProjectCharacters: state.characters,
      allProjectSceneTags: state.sceneTags,
    }))
  );

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [currentDescription, setCurrentDescription] = useState(
    scene.outline_description || ""
  );
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<
    PrimarySceneCategory | null | undefined
  >(scene.primary_category);

  const [isEditingPov, setIsEditingPov] = useState(false);
  const [currentPovCharId, setCurrentPovCharId] = useState(
    scene.pov_character_id || null
  );

  const [isManageCharsModalOpen, setIsManageCharsModalOpen] = useState(false);
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);

  const [isAnalyzingCharacters, setIsAnalyzingCharacters] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  // Type the parameters in the component
  const povCharacterName = allProjectCharacters.find(
    (c: Character) => c.id === scene.pov_character_id
  )?.name;

  const PREDEFINED_GLOBAL_TAG_NAMES = [
    "Opening Hook",
    "Inciting Incident",
    "Plot Twist",
    "Climactic",
    "Resolution",
    "Character Introduction",
    "Flashback",
    "Foreshadowing",
    "Comic Relief",
    "Romantic",
    "Suspense Building",
    "Info Dump",
  ];

  useEffect(() => {
    setCurrentDescription(scene.outline_description || "");
    setCurrentCategory(scene.primary_category);
    setCurrentPovCharId(scene.pov_character_id || null);
  }, [scene]);

  const handleSaveDescription = async () => {
    await onSceneUpdate({ outline_description: currentDescription });
    setIsEditingDescription(false);
  };

  const handleGenerateDescription = async () => {
    if (!scene.title && !scene.content?.trim()) {
      toast.info(
        "A scene title or content is required to generate a description."
      );
      return;
    }
    setIsGeneratingDescription(true);
    const toastId = toast.loading(
      "AI is generating a description for the scene..."
    );

    try {
      const userPrompt = `Based on the provided scene context (title: "${
        scene.title || "Untitled"
      }" and its content), generate a concise and informative outline description. The description should summarize the key events, character actions, and plot significance of the scene in 1-3 sentences. Return only the generated description as plain text.`;

      const aiResponse = await sendMessage(
        projectId,
        AI_TOOL_NAMES.SCENE_OUTLINER,
        userPrompt,
        { scene } // Pass the whole scene object as context
      );

      if (
        aiResponse.content &&
        aiResponse.content.length > 0 &&
        aiResponse.content[0].type === "text"
      ) {
        const rawResponseText = (
          aiResponse.content[0] as import("snowgander").TextBlock
        ).text;

        let generatedDescription = rawResponseText.trim();
        // Clean up common AI conversational prefixes
        generatedDescription = generatedDescription
          .replace(
            /^(here's a description:|description:|here is the description:|the description is:)\s*/i,
            ""
          )
          .trim();
        generatedDescription = generatedDescription
          .replace(/^"|"$/g, "")
          .trim();

        setCurrentDescription(generatedDescription);
        toast.success("AI generated description is ready to be saved.", {
          id: toastId,
        });
      } else {
        const errorBlock = aiResponse.content?.find(
          (block) => block.type === "error"
        ) as import("snowgander").ErrorBlock | undefined;
        throw new Error(
          errorBlock?.publicMessage || "AI did not return a valid description."
        );
      }
    } catch (error) {
      console.error("Failed to generate scene description:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not generate description.",
        { id: toastId }
      );
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSaveCategory = async () => {
    await onSceneUpdate({ primary_category: currentCategory });
    setIsEditingCategory(false);
  };

  const handleSavePov = async () => {
    await onSceneUpdate({ pov_character_id: currentPovCharId });
    setIsEditingPov(false);
  };

  const handleSuggestCharacters = async () => {
    if (!scene.content?.trim()) {
      toast.info("Scene content is empty. Cannot analyze characters.");
      return;
    }
    setIsAnalyzingCharacters(true);
    const toastId = toast.loading("AI is analyzing characters in the scene...");

    try {
      const userPrompt = `Analyze the following scene content to identify the POV character and other characters present:\n\n${scene.content}`;

      const aiResponse = await sendMessage(
        projectId,
        AI_TOOL_NAMES.SCENE_CHARACTER_ANALYZER,
        userPrompt,
        { sceneContent: scene.content }
      );

      if (
        aiResponse.content &&
        aiResponse.content.length > 0 &&
        aiResponse.content[0].type === "text"
      ) {
        const rawResponseText = (
          aiResponse.content[0] as import("snowgander").TextBlock
        ).text;

        if (typeof rawResponseText !== "string") {
          console.error("Unexpected AI response format", rawResponseText);
          toast.error("AI returned an unexpected response format");
          return;
        }

        const cleanedJsonText = extractJsonFromString<string>(rawResponseText);

        if (!cleanedJsonText) {
          toast.error(
            "AI returned an empty or un-cleanable response for character suggestions.",
            { id: toastId }
          );
          return;
        }

        try {
          type AICharacterResponse = {
            povCharacterName: string | null;
            otherCharacterNames: string[];
          };

          const parsedResponse = JSON.parse(
            cleanedJsonText
          ) as AICharacterResponse;

          let newPovCharacterId: string | null = null;
          if (parsedResponse.povCharacterName) {
            const foundPov = allProjectCharacters.find(
              (c) =>
                c.name.toLowerCase() ===
                parsedResponse.povCharacterName!.toLowerCase()
            );
            if (foundPov) {
              newPovCharacterId = foundPov.id;
            } else {
              toast.info(
                `AI suggested POV character "${parsedResponse.povCharacterName}" not found in project characters.`
              );
            }
          }

          const newOtherCharacterIds: string[] = [];
          if (
            parsedResponse.otherCharacterNames &&
            parsedResponse.otherCharacterNames.length > 0
          ) {
            parsedResponse.otherCharacterNames.forEach((name) => {
              const foundChar = allProjectCharacters.find(
                (c) => c.name.toLowerCase() === name.toLowerCase()
              );
              if (foundChar && foundChar.id !== newPovCharacterId) {
                newOtherCharacterIds.push(foundChar.id);
              } else if (!foundChar) {
                toast.info(
                  `AI suggested other character "${name}" not found in project characters.`
                );
              }
            });
          }

          if (newPovCharacterId !== scene.pov_character_id) {
            await onSceneUpdate({ pov_character_id: newPovCharacterId });
          }

          const currentOtherIds =
            scene.scene_characters?.map((c) => c.character_id) || [];
          // Ensure comparison is robust to order differences
          const sortedNewOtherIds = [...new Set(newOtherCharacterIds)].sort(); // Remove duplicates and sort
          const sortedCurrentOtherIds = [...new Set(currentOtherIds)].sort(); // Remove duplicates and sort

          if (
            JSON.stringify(sortedNewOtherIds) !==
            JSON.stringify(sortedCurrentOtherIds)
          ) {
            await onCharacterLinkChange(
              sortedNewOtherIds.map((id) => ({ character_id: id }))
            );
          }

          toast.success("Characters suggested by AI and updated.", {
            id: toastId,
          });
        } catch (jsonError) {
          console.error("JSON Parse Error after cleaning:", jsonError);
          console.error("Original Raw Response Text from AI:", rawResponseText);
          console.error("Attempted Cleaned JSON Text:", cleanedJsonText);
          toast.error(
            "Failed to parse character suggestions from AI. The response format was unexpected even after cleaning.",
            { id: toastId }
          );
        }
      } else {
        const errorBlock = aiResponse.content?.find(
          (block) => block.type === "error"
        ) as import("snowgander").ErrorBlock | undefined;
        throw new Error(
          errorBlock?.publicMessage || "AI did not return valid character data."
        );
      }
    } catch (error) {
      console.error("Failed to suggest characters:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not suggest characters.",
        { id: toastId }
      );
    } finally {
      setIsAnalyzingCharacters(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!scene.content?.trim()) {
      toast.info("Scene content is empty. Cannot suggest tags.");
      return;
    }
    setIsSuggestingTags(true);
    const toastId = toast.loading("AI is suggesting tags for the scene...");

    try {
      const userPrompt = `Analyze the following scene content and suggest relevant tags from the predefined list:\n\n${scene.content}`;

      const aiResponse = await sendMessage(
        projectId,
        AI_TOOL_NAMES.SCENE_TAG_SUGGESTER,
        userPrompt,
        { sceneContent: scene.content }
      );

      if (
        aiResponse.content &&
        aiResponse.content.length > 0 &&
        aiResponse.content[0].type === "text"
      ) {
        const responseText = (
          aiResponse.content[0] as import("snowgander").TextBlock
        ).text;
        const parsedResponse = JSON.parse(responseText) as {
          suggestedTagNames: string[];
        };

        const validSuggestedTagNames = (
          parsedResponse.suggestedTagNames || []
        ).filter((name) =>
          PREDEFINED_GLOBAL_TAG_NAMES.some(
            (predefined) => predefined.toLowerCase() === name.toLowerCase()
          )
        );

        const newTagIds = validSuggestedTagNames
          .map((name) => {
            const foundTag = allProjectSceneTags.find(
              (t) =>
                t.name.toLowerCase() === name.toLowerCase() &&
                t.project_id === null
            );
            return foundTag?.id;
          })
          .filter((id): id is string => !!id);

        await onTagLinkChange(newTagIds.map((id) => ({ tag_id: id })));

        toast.success("Scene tags suggested by AI and updated.", {
          id: toastId,
        });
      } else {
        const errorBlock = aiResponse.content?.find(
          (block) => block.type === "error"
        ) as import("snowgander").ErrorBlock | undefined;
        throw new Error(
          errorBlock?.publicMessage || "AI did not return valid tag data."
        );
      }
    } catch (error) {
      console.error("Failed to suggest tags:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not suggest tags.",
        { id: toastId }
      );
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleSuggestCategory = async () => {
    if (!scene.content?.trim()) {
      toast.info("Scene content is empty. Cannot suggest category.");
      return;
    }
    setIsSuggestingCategory(true);
    const toastId = toast.loading("AI is suggesting a primary category...");

    try {
      const userPrompt = `Analyze the following scene content and suggest the most fitting primary category:\n\n${scene.content}`;

      const aiResponse = await sendMessage(
        projectId,
        AI_TOOL_NAMES.SCENE_CATEGORY_SUGGESTER,
        userPrompt,
        { sceneContent: scene.content }
      );

      if (
        aiResponse.content &&
        aiResponse.content.length > 0 &&
        aiResponse.content[0].type === "text"
      ) {
        const responseText = (
          aiResponse.content[0] as import("snowgander").TextBlock
        ).text;
        const parsedResponse = JSON.parse(responseText) as {
          suggestedCategory: string;
        };

        const suggestedCategory = parsedResponse.suggestedCategory;
        if (
          ALL_PRIMARY_SCENE_CATEGORIES.includes(
            suggestedCategory as PrimarySceneCategory
          )
        ) {
          await onSceneUpdate({
            primary_category: suggestedCategory as PrimarySceneCategory,
          });
          setCurrentCategory(suggestedCategory as PrimarySceneCategory);
          toast.success(
            `Primary category suggested by AI and set to "${suggestedCategory}".`,
            { id: toastId }
          );
        } else {
          throw new Error(
            `AI suggested an invalid category: "${suggestedCategory}".`
          );
        }
      } else {
        const errorBlock = aiResponse.content?.find(
          (block) => block.type === "error"
        ) as import("snowgander").ErrorBlock | undefined;
        throw new Error(
          errorBlock?.publicMessage || "AI did not return valid category data."
        );
      }
    } catch (error) {
      console.error("Failed to suggest category:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not suggest category.",
        { id: toastId }
      );
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-l border-border shadow-2xl z-50 flex flex-col max-w-xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
        role="dialog"
        aria-labelledby="scene-metadata-panel-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <Heading
            level={4}
            id="scene-metadata-panel-title"
            className="text-lg truncate border-none pb-0"
          >
            {scene.title || "Scene Details"}
          </Heading>
          <IconButton
            icon={X}
            aria-label="Close scene details"
            onClick={onClose}
            variant="ghost"
            size="sm"
          />
        </div>

        <ScrollArea className="flex-grow p-4 space-y-5">
          <section>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Synopsis / Outline
              </label>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-1 h-auto"
                  onClick={() => setIsEditingDescription(true)}
                >
                  <Edit3 size={12} className="mr-1" /> Edit
                </Button>
              )}
            </div>
            {isEditingDescription ? (
              <>
                <Textarea
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                  rows={5}
                  className="text-sm w-full bg-input"
                  placeholder="Enter scene description..."
                />
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription}
                    title="Generate description based on scene content"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles size={14} className="mr-1.5" />
                    )}
                    {isGeneratingDescription
                      ? "Generating..."
                      : "Generate with AI"}
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setIsEditingDescription(false);
                        setCurrentDescription(scene.outline_description || "");
                      }}
                      disabled={isGeneratingDescription}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={handleSaveDescription}
                      disabled={isGeneratingDescription}
                    >
                      <Save size={12} className="mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Paragraph className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-md min-h-[40px]">
                {currentDescription || (
                  <span className="italic text-muted-foreground">
                    No description set.
                  </span>
                )}
              </Paragraph>
            )}
          </section>
          <Separator />

          <section>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Primary Category
              </label>
              {!isEditingCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-1 h-auto"
                  onClick={() => setIsEditingCategory(true)}
                >
                  <Edit3 size={12} className="mr-1" /> Edit
                </Button>
              )}
            </div>
            {isEditingCategory ? (
              <>
                <select
                  value={currentCategory || ""}
                  onChange={(e) =>
                    setCurrentCategory(
                      (e.target.value as PrimarySceneCategory) || null
                    )
                  }
                  className="w-full p-2 border border-input rounded-md text-sm bg-background focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Category</option>
                  {ALL_PRIMARY_SCENE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setIsEditingCategory(false);
                      setCurrentCategory(scene.primary_category);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={handleSaveCategory}
                  >
                    <Save size={12} className="mr-1" /> Save
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Paragraph className="text-sm text-foreground bg-muted/30 p-2 rounded-md min-h-[36px] flex items-center">
                  {currentCategory || (
                    <span className="italic text-muted-foreground">
                      Not set.
                    </span>
                  )}
                </Paragraph>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full h-8 mt-1"
                  onClick={handleSuggestCategory}
                  disabled={isSuggestingCategory || !scene.content?.trim()}
                  title={
                    !scene.content?.trim()
                      ? "Scene content is empty. Add content to enable AI suggestions."
                      : "Suggest primary category based on scene content"
                  }
                >
                  {isSuggestingCategory ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles size={14} className="mr-1.5" />
                  )}
                  {isSuggestingCategory
                    ? "Suggesting Category..."
                    : "AI Suggest Category"}
                </Button>
              </>
            )}
          </section>
          <Separator />

          <section>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {scene.scene_applied_tags &&
              scene.scene_applied_tags.length > 0 ? (
                scene.scene_applied_tags.map(({ tag_id }) => {
                  const tag = allProjectSceneTags.find((t) => t.id === tag_id);
                  return tag ? (
                    <span
                      key={tag_id}
                      className="px-2.5 py-1 text-xs bg-primary/10 text-primary font-medium rounded-full flex items-center"
                      style={
                        tag.color
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : {}
                      }
                    >
                      {tag.name}
                    </span>
                  ) : null;
                })
              ) : (
                <Paragraph className="text-sm italic text-muted-foreground pl-1">
                  No tags assigned.
                </Paragraph>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full h-8"
                onClick={() => setIsManageTagsModalOpen(true)}
              >
                Manage Tags
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full h-8"
                onClick={handleSuggestTags}
                disabled={isSuggestingTags || !scene.content?.trim()}
                title={
                  !scene.content?.trim()
                    ? "Scene content is empty. Add content to enable AI suggestions."
                    : "Suggest tags based on scene content"
                }
              >
                {isSuggestingTags ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Sparkles size={14} className="mr-1.5" />
                )}
                {isSuggestingTags ? "Suggesting Tags..." : "AI Suggest Tags"}
              </Button>
            </div>
          </section>
          <Separator />

          <section>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Point of View
              </label>
              {!isEditingPov && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs p-1 h-auto"
                  onClick={() => setIsEditingPov(true)}
                >
                  <Edit3 size={12} className="mr-1" /> Edit
                </Button>
              )}
            </div>
            {isEditingPov ? (
              <>
                <select
                  value={currentPovCharId || ""}
                  onChange={(e) => setCurrentPovCharId(e.target.value || null)}
                  className="w-full p-2 border border-input rounded-md text-sm bg-background focus:ring-primary focus:border-primary"
                >
                  <option value="">Select POV Character</option>
                  {allProjectCharacters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setIsEditingPov(false);
                      setCurrentPovCharId(scene.pov_character_id || null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleSavePov}>
                    <Save size={12} className="mr-1" /> Save
                  </Button>
                </div>
              </>
            ) : (
              <Paragraph className="text-sm text-foreground bg-muted/30 p-2 rounded-md min-h-[36px] flex items-center">
                {povCharacterName || (
                  <span className="italic text-muted-foreground">Not set.</span>
                )}
              </Paragraph>
            )}
          </section>
          <Separator />

          <section>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Other Characters
            </label>
            <div className="mb-2 min-h-[20px] pl-1">
              {scene.scene_characters && scene.scene_characters.length > 0 ? (
                scene.scene_characters
                  .map(
                    ({ character_id }) =>
                      allProjectCharacters.find((c) => c.id === character_id)
                        ?.name
                  )
                  .filter(Boolean)
                  .join(", ")
              ) : (
                <Paragraph className="text-sm italic text-muted-foreground">
                  No additional characters.
                </Paragraph>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs w-full h-8"
              onClick={() => setIsManageCharsModalOpen(true)}
            >
              Manage Characters
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs w-full h-8 mt-1"
              onClick={handleSuggestCharacters}
              disabled={isAnalyzingCharacters || !scene.content?.trim()}
              title={
                !scene.content?.trim()
                  ? "Scene content is empty. Add content to enable AI suggestions."
                  : "Suggest characters based on scene content"
              }
            >
              {isAnalyzingCharacters ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Sparkles size={14} className="mr-1.5" />
              )}
              {isAnalyzingCharacters
                ? "Analyzing Characters..."
                : "AI Suggest Characters"}
            </Button>
          </section>
        </ScrollArea>

        {isManageTagsModalOpen && (
          <ManageSceneTagsModal
            isOpen={isManageTagsModalOpen}
            onClose={() => setIsManageTagsModalOpen(false)}
            allProjectSceneTags={allProjectSceneTags}
            currentSceneTagIds={
              scene.scene_applied_tags?.map((t) => t.tag_id) || []
            }
            onSave={async (savedSceneId, selectedTagIds) => {
              await onTagLinkChange(
                selectedTagIds.map((id) => ({ tag_id: id }))
              );
              setIsManageTagsModalOpen(false);
            }}
            sceneTitle={scene.title || "Scene"}
            projectId={projectId}
            sceneId={scene.id}
          />
        )}
        {isManageCharsModalOpen && (
          <ManageSceneCharactersModal
            isOpen={isManageCharsModalOpen}
            onClose={() => setIsManageCharsModalOpen(false)}
            allProjectCharacters={allProjectCharacters}
            currentSceneCharacterIds={
              scene.scene_characters?.map((c) => c.character_id) || []
            }
            onSave={async (savedSceneId, selectedCharacterIds) => {
              await onCharacterLinkChange(
                selectedCharacterIds.map((id) => ({ character_id: id }))
              );
              setIsManageCharsModalOpen(false);
            }}
            sceneTitle={scene.title || "Scene"}
            projectId={projectId}
            sceneId={scene.id}
          />
        )}
      </div>
    </>
  );
}
