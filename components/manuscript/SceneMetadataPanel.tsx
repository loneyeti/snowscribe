import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type {
  Scene,
  Character,
  SceneTag,
  PrimarySceneCategory,
} from "@/lib/types";
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
import { X, Edit3, Save } from "lucide-react";

export interface SceneMetadataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene;
  projectId: string;
  chapterId: string;
  allProjectCharacters: Character[];
  allProjectSceneTags: SceneTag[];
  onSceneUpdate: (
    updatedData: Partial<
      Pick<
        Scene,
        "outline_description" | "pov_character_id" | "primary_category"
      >
    >
  ) => Promise<void>;
  onCharacterLinkChange: (characterIds: string[]) => Promise<void>;
  onTagLinkChange: (tagIds: string[]) => Promise<void>;
  className?: string;
}

export function SceneMetadataPanel({
  isOpen,
  onClose,
  scene,
  projectId,
  // chapterId is not used in this component, so remove it to fix eslint error
  allProjectCharacters,
  allProjectSceneTags,
  onSceneUpdate,
  onCharacterLinkChange,
  onTagLinkChange,
  className,
}: Omit<SceneMetadataPanelProps, "chapterId">) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [currentDescription, setCurrentDescription] = useState(
    scene.outline_description || ""
  );

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

  useEffect(() => {
    setCurrentDescription(scene.outline_description || "");
    setCurrentCategory(scene.primary_category);
    setCurrentPovCharId(scene.pov_character_id || null);
  }, [scene]);

  const handleSaveDescription = async () => {
    await onSceneUpdate({ outline_description: currentDescription });
    setIsEditingDescription(false);
  };

  const handleSaveCategory = async () => {
    await onSceneUpdate({ primary_category: currentCategory });
    setIsEditingCategory(false);
  };

  const handleSavePov = async () => {
    await onSceneUpdate({ pov_character_id: currentPovCharId });
    setIsEditingPov(false);
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

  const povCharacterName = allProjectCharacters.find(
    (c) => c.id === scene.pov_character_id
  )?.name;

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
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setIsEditingDescription(false);
                      setCurrentDescription(scene.outline_description || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={handleSaveDescription}
                  >
                    <Save size={12} className="mr-1" /> Save
                  </Button>
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
              <Paragraph className="text-sm text-foreground bg-muted/30 p-2 rounded-md min-h-[36px] flex items-center">
                {currentCategory || (
                  <span className="italic text-muted-foreground">Not set.</span>
                )}
              </Paragraph>
            )}
          </section>
          <Separator />

          <section>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {scene.tag_ids && scene.tag_ids.length > 0 ? (
                scene.tag_ids.map((tagId) => {
                  const tag = allProjectSceneTags.find((t) => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
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
            <Button
              variant="outline"
              size="sm"
              className="text-xs w-full h-8"
              onClick={() => setIsManageTagsModalOpen(true)}
            >
              Manage Tags
            </Button>
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
              {scene.other_character_ids &&
              scene.other_character_ids.length > 0 ? (
                scene.other_character_ids
                  .map(
                    (charId) =>
                      allProjectCharacters.find((c) => c.id === charId)?.name
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
          </section>
        </ScrollArea>

        {isManageTagsModalOpen && (
          <ManageSceneTagsModal
            isOpen={isManageTagsModalOpen}
            onClose={() => setIsManageTagsModalOpen(false)}
            allProjectSceneTags={allProjectSceneTags}
            currentSceneTagIds={scene.tag_ids || []}
            onSave={async (savedSceneId, selectedTagIds) => {
              await onTagLinkChange(selectedTagIds);
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
            currentSceneCharacterIds={scene.other_character_ids || []}
            onSave={async (savedSceneId, selectedCharacterIds) => {
              await onCharacterLinkChange(selectedCharacterIds);
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
