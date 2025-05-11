"use client";

import React, { useState, useEffect } from "react";
import type { Chapter, Scene, Character, SceneTag } from "@/lib/types";
import { ListContainer } from "@/components/ui/ListContainer";
// import { ListItem } from "@/components/ui/ListItem"; // Assuming this will be used for scenes - Commented out
import { ListSectionHeader } from "@/components/ui/ListSectionHeader"; // For chapter titles
import { Textarea } from "@/components/ui/Textarea"; // Uncommented
import { Button } from "@/components/ui/Button";
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  Save, // Uncommented
  PlusCircle,
} from "lucide-react";
import { ManageSceneCharactersModal } from "@/components/modals/ManageSceneCharactersModal";
import { ManageSceneTagsModal } from "@/components/modals/ManageSceneTagsModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal"; // Added

// import { SceneOutlineCard } from "./SceneOutlineCard"; // This might be the individual editable scene item

interface ChapterSceneOutlineListProps {
  chapters: Chapter[]; // Chapters should include their scenes, or scenes are fetched separately
  characters: Character[]; // For POV and other character selection
  sceneTags: SceneTag[]; // For tag selection
  projectId: string;
  onSceneUpdate: (
    chapterId: string,
    sceneId: string,
    updatedData: Partial<Scene>
  ) => void;
  // isLoadingSceneTags?: boolean; // Added for loading state of all scene tags
  // onSceneOrderChange: (...) => void;
  // onChapterOrderChange: (...) => void;
}

// TODO: Define a more specific type for scenes within this outline context if needed
// e.g., SceneWithOutlineDetails extends Scene { ... }

export function ChapterSceneOutlineList({
  chapters,
  characters,
  sceneTags, // Uncommented
  projectId, // Uncommented
  onSceneUpdate,
}: ChapterSceneOutlineListProps) {
  console.log("ChapterSceneOutlineList:");
  console.log(`Chapters: ${JSON.stringify(chapters)} `);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Scene>>({});

  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setExpandedChapters(new Set(chapters.map((chapter) => chapter.id)));
    } else {
      setExpandedChapters(new Set()); // Clear if chapters are empty or undefined
    }
  }, [chapters]);

  const [isManageCharsModalOpen, setIsManageCharsModalOpen] = useState(false);
  const [managingCharsForScene, setManagingCharsForScene] =
    useState<Scene | null>(null);

  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);
  const [managingTagsForScene, setManagingTagsForScene] =
    useState<Scene | null>(null);

  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false); // State for create scene modal
  const [creatingSceneInChapterId, setCreatingSceneInChapterId] = useState<
    string | null
  >(null); // State for target chapter

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
      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
        No chapters found for this project. Add chapters in the Manuscript
        section first, or create them here.
        {/* TODO: Add chapter creation directly from outline */}
      </p>
    );
  }

  return (
    <>
      <ListContainer className="h-full overflow-y-auto">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="mb-2 last:mb-0">
            <ListSectionHeader
              title={chapter.title || "Untitled Chapter"}
              className="sticky top-0 z-10 bg-white dark:bg-slate-800"
              // actionElement={
              //   <Button variant="ghost" size="sm" onClick={() => toggleChapterExpansion(chapter.id)}>
              //     {expandedChapters.has(chapter.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              //   </Button>
              // }
              // TODO: Add button to add scene to this chapter
            >
              <Button
                variant="ghost"
                size="sm" // Changed from iconSm
                onClick={() => toggleChapterExpansion(chapter.id)}
                aria-expanded={expandedChapters.has(chapter.id)}
                aria-controls={`chapter-scenes-${chapter.id}`}
                className="mr-2 p-1 h-auto" // Adjusted padding for smaller feel if needed
              >
                {expandedChapters.has(chapter.id) ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </Button>
              {/* The ListSectionHeader's title prop should handle displaying the title. */}
              {/* The span duplicating the title is removed. */}
              {/* Adding a spacer to push the "Add Scene" button to the right. */}
              <div className="flex-grow" />
              <Button
                variant="ghost"
                size="sm" // Changed from iconSm
                onClick={() => {
                  setCreatingSceneInChapterId(chapter.id);
                  setIsCreateSceneModalOpen(true);
                }}
                title="Add Scene to Chapter"
                className="p-1 h-auto" // Adjusted padding
              >
                <PlusCircle size={18} />
              </Button>
            </ListSectionHeader>

            {expandedChapters.has(chapter.id) && (
              <div
                id={`chapter-scenes-${chapter.id}`}
                className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-3"
              >
                {chapter.scenes && chapter.scenes.length > 0 ? (
                  chapter.scenes
                    .sort((a, b) => a.order - b.order)
                    .map((scene) => (
                      <div
                        key={scene.id}
                        className="py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                      >
                        <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">
                          {scene.title || "Untitled Scene"}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                          {scene.outline_description || (
                            <span className="italic">
                              No outline description.
                            </span>
                          )}
                        </p>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          <span>
                            POV:{" "}
                            {characters.find(
                              (c) => c.id === scene.pov_character_id
                            )?.name || <span className="italic">Not set</span>}
                          </span>
                          <div className="mt-1">
                            Other Characters:{" "}
                            {scene.other_character_ids &&
                            scene.other_character_ids.length > 0 ? (
                              scene.other_character_ids
                                .map(
                                  (charId) =>
                                    characters.find((c) => c.id === charId)
                                      ?.name
                                )
                                .filter((name) => !!name)
                                .join(", ")
                            ) : (
                              <span className="italic">None</span>
                            )}
                          </div>
                          <div className="mt-1">
                            Tags:{" "}
                            {scene.tag_ids && scene.tag_ids.length > 0 ? (
                              scene.tag_ids
                                .map(
                                  (tagId) =>
                                    sceneTags.find((t) => t.id === tagId)?.name
                                )
                                .filter((name) => !!name)
                                .join(", ")
                            ) : (
                              <span className="italic">None</span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm" // Changed from xs
                          onClick={() => {
                            setEditingSceneId(scene.id);
                            setEditFormData({
                              outline_description:
                                scene.outline_description || "",
                              pov_character_id: scene.pov_character_id || null,
                              // Initialize other fields as needed
                            });
                          }}
                          className="text-xs h-7 px-2" // More fine-grained control for "xs" feel
                        >
                          <Edit3 size={14} className="mr-1" /> Edit Details
                        </Button>

                        {editingSceneId === scene.id && (
                          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-md">
                            <div className="mb-3">
                              <label
                                htmlFor={`outline_desc_${scene.id}`}
                                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                              >
                                Outline Description
                              </label>
                              <Textarea
                                id={`outline_desc_${scene.id}`}
                                value={editFormData.outline_description || ""}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    outline_description: e.target.value,
                                  }))
                                }
                                rows={3}
                                className="text-xs"
                              />
                            </div>
                            <div className="mb-3">
                              <label
                                htmlFor={`pov_char_${scene.id}`}
                                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                              >
                                POV Character
                              </label>
                              <select
                                id={`pov_char_${scene.id}`}
                                value={editFormData.pov_character_id || ""}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    pov_character_id: e.target.value || null,
                                  }))
                                }
                                className="w-full p-2 border rounded text-xs bg-white dark:bg-slate-800 dark:border-slate-600 focus:ring-primary focus:border-primary"
                              >
                                <option value="">Select POV Character</option>
                                {characters.map((char) => (
                                  <option key={char.id} value={char.id}>
                                    {char.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Other Characters in Scene
                              </label>
                              {/* TODO: Display current other characters */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setManagingCharsForScene(scene);
                                  setIsManageCharsModalOpen(true);
                                }}
                              >
                                Manage Characters
                              </Button>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Scene Tags
                              </label>
                              {/* TODO: Display current scene tags */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2"
                                onClick={() => {
                                  setManagingTagsForScene(scene);
                                  setIsManageTagsModalOpen(true);
                                }}
                              >
                                Manage Tags
                              </Button>
                            </div>
                            <div className="flex justify-end space-x-2 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingSceneId(null);
                                  setEditFormData({});
                                }}
                                className="text-xs h-7 px-2"
                              >
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
                                className="text-xs h-7 px-2"
                              >
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="py-3 text-xs text-slate-500 dark:text-slate-400 italic">
                    No scenes in this chapter yet.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </ListContainer>
      {managingCharsForScene &&
        isManageCharsModalOpen && ( // Ensure modal only renders if both are true
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
            projectId={projectId} // Pass projectId
            sceneId={managingCharsForScene?.id || ""} // Pass sceneId, ensure it's not null
            onSave={(sceneId, selectedCharacterIds) => {
              // Updated onSave signature
              if (managingCharsForScene) {
                console.log(
                  "Save characters for scene:",
                  sceneId, // Use sceneId from callback
                  selectedCharacterIds
                );
                // TODO: Implement actual state update or re-fetch logic
                // For now, we can call onSceneUpdate to potentially trigger a refresh
                // or update the local scene data directly if the parent component handles it.
                onSceneUpdate(managingCharsForScene.chapter_id, sceneId, {
                  other_character_ids: selectedCharacterIds,
                });
                // Optionally, refresh data from ProjectDashboardClient or update local state here
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
          onSave={(sceneId, selectedTagIds) => {
            if (managingTagsForScene) {
              console.log("Save tags for scene:", sceneId, selectedTagIds);
              onSceneUpdate(managingTagsForScene.chapter_id, sceneId, {
                tag_ids: selectedTagIds,
              });
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
          onSceneCreated={(newScene) => {
            // Call onSceneUpdate to notify ProjectDashboardClient to add the new scene
            // ProjectDashboardClient will need to handle adding this scene to the correct chapter's scene list
            onSceneUpdate(creatingSceneInChapterId, newScene.id, newScene);
            setIsCreateSceneModalOpen(false);
            setCreatingSceneInChapterId(null);
            // Optionally, if onSceneUpdate doesn't trigger a re-render that includes the new scene,
            // you might need to manually update the local 'chapters' state here or trigger a re-fetch.
            // For now, relying on ProjectDashboardClient to handle state update.
          }}
        />
      )}
    </> // This closes the React.Fragment
  );
}
