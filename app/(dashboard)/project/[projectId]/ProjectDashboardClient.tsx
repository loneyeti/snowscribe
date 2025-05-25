"use client";

import React, { useState, useEffect, useCallback } from "react";
// Import all types directly from @/lib/types
import type {
  Project,
  Chapter,
  Genre,
  Scene,
  Character,
  WorldBuildingNote, // Added WorldBuildingNote
  // CharacterFormValues, // Not directly used here anymore, CharacterFormData from editor is based on UpdateCharacterValues
  // WorldBuildingNoteFormValues, // Will be imported from schema
  SceneTag, // Will be needed for outline
} from "@/lib/types";
// import { getChaptersByProjectId } from "@/lib/data/chapters";
import { getScenesByChapterId } from "@/lib/data/scenes";
import {
  getCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter as deleteCharacterData,
} from "@/lib/data/characters";
import {
  getWorldBuildingNotes,
  getWorldBuildingNote,
  updateWorldBuildingNote,
  deleteWorldBuildingNote as deleteWorldBuildingNoteData,
} from "@/lib/data/worldBuildingNotes"; // Added world note data functions
import { toast } from "sonner";
// import { Geist } from "next/font/google"; // Removed Geist import
import { cactusSerif } from "@/lib/fonts"; // Import cactusSerif
import { countWords } from "@/lib/utils"; // Import countWords
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
// import { ListSectionHeader } from "@/components/ui/ListSectionHeader"; // Removed as it's not used yet
import { ContextualHeader } from "@/components/ui/ContextualHeader";
// import { ContextualNavControls } from "@/components/ui/ContextualNavControls"; // Removed as it's not used directly
import { IconButton } from "@/components/ui/IconButton";
import { ManuscriptEditor } from "@/components/editors/ManuscriptEditor";
import {
  CharacterCardEditor,
  type CharacterFormData,
} from "@/components/editors/CharacterCardEditor";
import { CreateChapterModal } from "@/components/manuscript/CreateChapterModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal";
import { CreateCharacterModal } from "@/components/characters/CreateCharacterModal";
import { CharacterList } from "@/components/characters/CharacterList";
import { WorldNoteList } from "@/components/world-notes/WorldNoteList"; // Added
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal"; // Added
import { WorldNoteEditor } from "@/components/world-notes/WorldNoteEditor"; // Added
import { Paragraph } from "@/components/typography/Paragraph"; // Added Paragraph import
import {
  PlusCircle,
  ArrowLeft,
  FileText,
  ClipboardList,
  Sparkles,
} from "lucide-react"; // Added FileText, ClipboardList
import { AISidePanel } from "@/components/ai/AISidePanel";

// Define view states for the manuscript section
type ManuscriptView = "chapters" | "scenes";
// Define view states for the outline section
type OutlineView = "synopsis" | "scenes";

// Geist Sans font initialization removed

// Import the specific form values type from its schema file
import { type WorldBuildingNoteFormValues as WorldNoteFormValuesTypeFromSchema } from "@/lib/schemas/worldBuildingNote.schema";
import { ProjectSynopsisEditor } from "@/components/outline/ProjectSynopsisEditor"; // Added
import { CharacterCardQuickViewList } from "@/components/outline/CharacterCardQuickViewList"; // Added
import { ChapterSceneOutlineList } from "@/components/outline/ChapterSceneOutlineList"; // Added

interface ProjectDashboardClientProps {
  project: Project & { genres: Genre | null };
  activeSection?: string; // Made optional, AppShell will inject it
  onSectionChange?: (sectionId: string) => void; // Made optional
}

export function ProjectDashboardClient({
  project,
  activeSection = "manuscript", // Provide default if not passed, though AppShell should always pass it
}: // onSectionChange,
ProjectDashboardClientProps) {
  // Removed internal activeSection state
  const [manuscriptView, setManuscriptView] =
    useState<ManuscriptView>("chapters");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [scenesForSelectedChapter, setScenesForSelectedChapter] = useState<
    Scene[]
  >([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [currentSceneWordCount, setCurrentSceneWordCount] = useState(0); // State for word count
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false); // State for AI panel visibility
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isCreateChapterModalOpen, setIsCreateChapterModalOpen] =
    useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);

  // Character states
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharactersData, setIsLoadingCharactersData] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [isCreateCharacterModalOpen, setIsCreateCharacterModalOpen] =
    useState(false);

  // World Note states
  const [worldNotes, setWorldNotes] = useState<WorldBuildingNote[]>([]);
  const [isLoadingWorldNotesData, setIsLoadingWorldNotesData] = useState(false);
  const [selectedWorldNote, setSelectedWorldNote] =
    useState<WorldBuildingNote | null>(null);
  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  // Outline states
  const [outlineView, setOutlineView] = useState<OutlineView>("synopsis");
  // Add other outline-specific states here as needed, e.g., for scene tags
  const [allSceneTags, setAllSceneTags] = useState<SceneTag[]>([]);
  const [isLoadingAllSceneTags, setIsLoadingAllSceneTags] = useState(false);
  const [sceneTagsFetchAttempted, setSceneTagsFetchAttempted] = useState(false); // Added fetch attempt flag
  const [currentProjectDetails, setCurrentProjectDetails] = useState(project);

  useEffect(() => {
    setCurrentProjectDetails(project);
    // Reset project-specific data when the main 'project' prop changes
    setChapters([]);
    setScenesForSelectedChapter([]);
    setSelectedChapter(null);
    setSelectedScene(null);
    setCharacters([]);
    setSelectedCharacter(null);
    setWorldNotes([]);
    setSelectedWorldNote(null);
    setAllSceneTags([]); // Clear scene tags for the new project
    setSceneTagsFetchAttempted(false); // Reset fetch attempt flag for scene tags
  }, [project]);

  const fetchProjectChapters = useCallback(async () => {
    setIsLoadingChapters(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/chapters`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to load chapters and parse error response.",
        }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const fetchedChapters = (await response.json()) as Chapter[];
      setChapters(fetchedChapters);
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load chapters."
      );
    } finally {
      setIsLoadingChapters(false);
    }
  }, [project.id]); // Added missing dependency array for useCallback

  useEffect(() => {
    if (
      project.id &&
      activeSection === "manuscript" &&
      manuscriptView === "chapters"
    ) {
      fetchProjectChapters();
    }
  }, [project.id, activeSection, manuscriptView, fetchProjectChapters]);

  const fetchProjectCharacters = useCallback(async () => {
    if (!project.id) return;
    setIsLoadingCharactersData(true);
    try {
      const fetchedCharacters = await getCharacters(project.id);
      setCharacters(fetchedCharacters);
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load characters."
      );
    } finally {
      setIsLoadingCharactersData(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (project.id && activeSection === "characters") {
      fetchProjectCharacters();
    }
  }, [project.id, activeSection, fetchProjectCharacters]);

  const fetchProjectWorldNotes = useCallback(async () => {
    if (!project.id) return;
    setIsLoadingWorldNotesData(true);
    try {
      const fetchedNotes = await getWorldBuildingNotes(project.id);
      setWorldNotes(fetchedNotes);
    } catch (error) {
      console.error("Failed to fetch world notes:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load world notes."
      );
    } finally {
      setIsLoadingWorldNotesData(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (project.id && activeSection === "world-notes") {
      fetchProjectWorldNotes();
    }
    // Fetch characters if in Outline > Synopsis view and characters aren't loaded
    if (
      project.id &&
      activeSection === "outline" &&
      outlineView === "synopsis" &&
      characters.length === 0 && // Only fetch if characters array is empty
      !isLoadingCharactersData // And not already loading
    ) {
      fetchProjectCharacters();
    }
    // Fetch chapters if in Outline > Scenes view and chapters aren't loaded
    // Assuming fetchProjectChapters populates chapters with their scenes for outline purposes
    if (
      project.id &&
      activeSection === "outline" &&
      outlineView === "scenes" &&
      chapters.length === 0 // Only fetch if not already loaded or manuscript hasn't loaded them
    ) {
      fetchProjectChapters(); // This should ideally fetch chapters with their scenes including outline fields
    }

    // Fetch all scene tags if in Outline section and tags aren't loaded
    // This logic is now handled by the dedicated useEffect for scene tags below
  }, [
    project.id,
    activeSection,
    fetchProjectWorldNotes,
    outlineView,
    characters.length, // Add characters.length to dependencies
    isLoadingCharactersData, // Add isLoadingCharactersData to dependencies
    fetchProjectCharacters,
    // chapters.length, // Removed to prevent loop if fetch results in empty
    fetchProjectChapters,
  ]);

  const fetchAllSceneTags = useCallback(async () => {
    if (!project.id) return;
    setIsLoadingAllSceneTags(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/scene-tags`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to load scene tags and parse error response.",
        }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const fetchedTags = (await response.json()) as SceneTag[];
      setAllSceneTags(fetchedTags);

      //setAllSceneTags([]);
    } catch (error) {
      console.error("Failed to fetch scene tags:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load scene tags."
      );
    } finally {
      setIsLoadingAllSceneTags(false);
    }
  }, [project.id]);

  // Add fetchAllSceneTags to the dependency array of the useEffect above
  // This is a bit tricky as useEffects are defined before callbacks usually.
  // Let's adjust the useEffect to include it.
  // No, it's better to define callbacks first, then useEffects that use them.
  // The previous useEffect needs fetchAllSceneTags in its dependency array.
  // Let's re-evaluate the useEffect structure or add a new one for tags.

  // New useEffect specifically for fetching scene tags when in outline section
  useEffect(() => {
    if (
      project.id &&
      activeSection === "outline" &&
      !sceneTagsFetchAttempted && // Use fetch attempt flag
      !isLoadingAllSceneTags // And not currently loading
    ) {
      setSceneTagsFetchAttempted(true); // Mark as attempted before fetching
      fetchAllSceneTags();
    }
  }, [
    project.id,
    activeSection,
    sceneTagsFetchAttempted, // Add to dependencies
    isLoadingAllSceneTags, // Add to dependencies
    fetchAllSceneTags,
  ]);

  // Effect to reset views when activeSection (prop) changes
  useEffect(() => {
    // Reset manuscript specific views when changing main section
    if (activeSection !== "manuscript") {
      setManuscriptView("chapters");
      setSelectedChapter(null);
      setSelectedScene(null);
      setScenesForSelectedChapter([]);
    }
    // Reset character specific views
    if (activeSection !== "characters") {
      setSelectedCharacter(null);
    }
    if (activeSection !== "world-notes") {
      setSelectedWorldNote(null);
    }
    // Reset outline specific views
    if (activeSection !== "outline") {
      setOutlineView("synopsis"); // Default to synopsis when leaving outline section
      setSceneTagsFetchAttempted(false); // Reset fetch attempt flag when leaving outline section
      // Reset other outline-specific data states here
    } else {
      // When entering outline section, ensure default view is set
      // This might be redundant if AppShell sets activeSection and this effect runs,
      // but good for explicit state setting.
      setOutlineView((prev) => prev || "synopsis");
      // sceneTagsFetchAttempted is reset when project changes or when navigating away from outline.
      // If navigating to outline, and it was false, the fetch effect will run.
    }
    // Add other section resets if necessary
  }, [activeSection]);

  const fetchScenesForChapter = async (chapterId: string) => {
    setIsLoadingScenes(true);
    try {
      const fetchedScenes = await getScenesByChapterId(project.id, chapterId);
      setScenesForSelectedChapter(fetchedScenes);
      if (fetchedScenes.length > 0) {
        // Optionally, auto-select the first scene
        // handleSceneSelect(fetchedScenes[0]);
      } else {
        console.log(
          `[ProjectDashboardClient] No scenes found for chapter ${chapterId}, setting selectedScene to null.`
        );
        setSelectedScene(null); // No scenes, so no scene selected
      }
    } catch (error) {
      console.error(`Failed to fetch scenes for chapter ${chapterId}:`, error);
      toast.error("Failed to load scenes for the chapter.");
      setScenesForSelectedChapter([]); // Ensure it's an empty array on error
    } finally {
      setIsLoadingScenes(false);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    console.log(
      "[ProjectDashboardClient] handleChapterSelect called for chapter:",
      chapter.id,
      chapter.title
    );
    setSelectedChapter(chapter);
    setManuscriptView("scenes");
    fetchScenesForChapter(chapter.id);
    setSelectedScene(null); // Clear previously selected scene
    console.log(
      "[ProjectDashboardClient] selectedScene explicitly set to null in handleChapterSelect"
    );
  };

  const handleSceneSelect = (scene: Scene) => {
    console.log(
      "[ProjectDashboardClient] handleSceneSelect called for scene:",
      scene.id,
      scene.title
    );
    setSelectedScene(scene);
    setCurrentSceneWordCount(scene.word_count || 0); // Update word count when scene is selected
    // ManuscriptEditor would then display this scene's content
  };

  const handleBackToChapters = () => {
    console.log("[ProjectDashboardClient] handleBackToChapters called");
    setManuscriptView("chapters");
    setSelectedChapter(null);
    setScenesForSelectedChapter([]);
    setSelectedScene(null);
    console.log(
      "[ProjectDashboardClient] selectedScene explicitly set to null in handleBackToChapters"
    );
  };

  const handleSaveSceneContent = async (text: string) => {
    if (!selectedScene || !selectedChapter) {
      toast.error("No scene or chapter selected to save.");
      return;
    }

    const wordCount = countWords(text);
    setCurrentSceneWordCount(wordCount); // Update display immediately

    try {
      const response = await fetch(
        `/api/projects/${project.id}/chapters/${selectedChapter.id}/scenes/${selectedScene.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }), // word_count is handled by DB trigger
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save scene content.");
      }

      const updatedSceneFromServer = (await response.json()) as Scene;

      // Update local selectedScene state with content and server-confirmed word_count
      setSelectedScene((prev) =>
        prev
          ? {
              ...prev,
              content: text, // Use the text from editor for immediate feedback on content
              word_count: updatedSceneFromServer.word_count, // Use server's word_count
            }
          : null
      );

      // Update the scene in the scenesForSelectedChapter list
      setScenesForSelectedChapter((prevScenes) =>
        prevScenes.map((s) =>
          s.id === selectedScene.id
            ? {
                ...s,
                content: text,
                word_count: updatedSceneFromServer.word_count,
              }
            : s
        )
      );
      // No need for a success toast for auto-save, it should be seamless
      // toast.success("Scene content saved!");
    } catch (error) {
      console.error("Failed to save scene content:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not save scene."
      );
      // Optionally, revert optimistic UI updates or re-fetch if save fails
      // For now, we keep the editor content as is, but word count might be out of sync with DB
      // Re-fetch the scene to get the last saved state
      if (selectedScene) {
        const reFetchedScene = await getScenesByChapterId(
          project.id,
          selectedChapter.id
        ).then((scenes) => scenes.find((s) => s.id === selectedScene.id));
        if (reFetchedScene) {
          setSelectedScene(reFetchedScene);
          setCurrentSceneWordCount(reFetchedScene.word_count || 0);
        }
      }
    }
  };

  // Character Handlers
  const handleCharacterSelect = async (characterId: string) => {
    // Attempt to find in current list first
    const existingCharacter = characters.find((c) => c.id === characterId);
    if (existingCharacter && existingCharacter.description !== undefined) {
      // Check if full data is likely present
      setSelectedCharacter(existingCharacter);
      return;
    }
    // If not found or potentially partial, fetch full details
    try {
      const characterDetails = await getCharacter(project.id, characterId);
      setSelectedCharacter(characterDetails);
    } catch (error) {
      toast.error("Failed to load character details.");
      console.error("Error fetching character details:", error);
    }
  };

  const handleOpenCreateCharacterModal = () => {
    setIsCreateCharacterModalOpen(true);
  };

  const handleCharacterCreated = (newCharacter: Character) => {
    setCharacters((prev) =>
      [...prev, newCharacter].sort((a, b) => a.name.localeCompare(b.name))
    );
    setSelectedCharacter(newCharacter); // Optionally auto-select
    setIsCreateCharacterModalOpen(false);
  };

  // This function updates state after a successful API call
  const processCharacterUpdate = (updatedCharacter: Character) => {
    setCharacters((prev) =>
      prev
        .map((c) => (c.id === updatedCharacter.id ? updatedCharacter : c))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    if (selectedCharacter?.id === updatedCharacter.id) {
      setSelectedCharacter(updatedCharacter);
    }
    toast.success(`Character "${updatedCharacter.name}" updated.`);
  };

  // This function is called by CharacterCardEditor's onSave
  const handleSaveCharacterEditorData = async (
    editorData: CharacterFormData
  ) => {
    if (!selectedCharacter) {
      toast.error("No character selected to save.");
      return;
    }

    // The editorData is already in the shape of UpdateCharacterValues (potentially with id)
    // We need to ensure we pass only the fields relevant for the update to the API.
    // The `updateCharacter` function expects `UpdateCharacterValues`.
    // `CharacterFormData` includes `id`, which `UpdateCharacterValues` does not.
    // Construct updatePayload by excluding 'id'.
    const updatePayload = {
      name: editorData.name,
      description: editorData.description,
      notes: editorData.notes,
      image_url: editorData.image_url,
      // Ensure all other fields from CharacterFormData (excluding id) that are part of UpdateCharacterValues are here
    };

    try {
      const updatedCharacterFromApi = await updateCharacter(
        project.id,
        selectedCharacter.id, // Use the ID of the character being edited
        updatePayload
      );
      processCharacterUpdate(updatedCharacterFromApi);
    } catch (error) {
      console.error("Failed to save character from editor:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save character details."
      );
    }
  };

  const handleCharacterDeleted = async (characterId: string) => {
    if (!selectedCharacter || selectedCharacter.id !== characterId) {
      toast.error("No character selected or ID mismatch for deletion.");
      return;
    }
    const characterNameToDelete = selectedCharacter.name;
    try {
      await deleteCharacterData(project.id, characterId);
      setCharacters((prev) => prev.filter((c) => c.id !== characterId));
      setSelectedCharacter(null);
      toast.success(`Character "${characterNameToDelete}" deleted.`);
    } catch (error) {
      console.error("Failed to delete character:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete character."
      );
    }
  };

  // World Note Handlers
  const handleWorldNoteSelect = async (noteId: string) => {
    const existingNote = worldNotes.find((n) => n.id === noteId);
    if (existingNote && existingNote.content !== undefined) {
      // Check if full data likely present
      setSelectedWorldNote(existingNote);
      return;
    }
    try {
      const noteDetails = await getWorldBuildingNote(project.id, noteId);
      setSelectedWorldNote(noteDetails);
    } catch (error) {
      toast.error("Failed to load world note details.");
      console.error("Error fetching world note details:", error);
    }
  };

  const handleOpenCreateWorldNoteModal = () => {
    setIsCreateWorldNoteModalOpen(true);
  };

  const handleWorldNoteCreated = (newNote: WorldBuildingNote) => {
    setWorldNotes((prev) =>
      [...prev, newNote].sort((a, b) => a.title.localeCompare(b.title))
    );
    setSelectedWorldNote(newNote); // Optionally auto-select
    setIsCreateWorldNoteModalOpen(false);
  };

  const handleSaveWorldNoteEditorData = async (
    editorData: WorldNoteFormValuesTypeFromSchema // Use the imported type
  ) => {
    if (!selectedWorldNote) {
      toast.error("No world note selected to save.");
      return;
    }
    try {
      const updatedNoteFromApi = await updateWorldBuildingNote(
        project.id,
        selectedWorldNote.id,
        editorData
      );
      setWorldNotes((prev) =>
        prev
          .map((n) => (n.id === updatedNoteFromApi.id ? updatedNoteFromApi : n))
          .sort((a, b) => a.title.localeCompare(b.title))
      );
      if (selectedWorldNote?.id === updatedNoteFromApi.id) {
        setSelectedWorldNote(updatedNoteFromApi);
      }
      toast.success(`Note "${updatedNoteFromApi.title}" updated.`);
    } catch (error) {
      console.error("Failed to save world note from editor:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save world note details."
      );
    }
  };

  const handleWorldNoteDeleted = async (noteId: string) => {
    if (!selectedWorldNote || selectedWorldNote.id !== noteId) {
      toast.error("No world note selected or ID mismatch for deletion.");
      return;
    }
    const noteNameToDelete = selectedWorldNote.title;
    try {
      await deleteWorldBuildingNoteData(project.id, noteId);
      setWorldNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSelectedWorldNote(null);
      toast.success(`Note "${noteNameToDelete}" deleted.`);
    } catch (error) {
      console.error("Failed to delete world note:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not delete world note."
      );
    }
  };

  const renderManuscriptView = () => {
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
                <p className="p-4 text-sm text-muted-foreground">
                  Loading chapters...
                </p>
              ) : chapters.length > 0 ? (
                chapters.map((chapter) => (
                  <ListItem
                    key={chapter.id}
                    title={chapter.title}
                    // TODO: Add scene count and word count to Chapter type or fetch separately
                    secondaryText={`Order: ${chapter.order}`}
                    onClick={() => handleChapterSelect(chapter)}
                    isSelected={selectedChapter?.id === chapter.id}
                  />
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No chapters yet. Create one to get started!
                </p>
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
                <p className="p-4 text-sm text-muted-foreground">
                  Loading scenes...
                </p>
              ) : scenesForSelectedChapter.length > 0 ? (
                scenesForSelectedChapter.map((scene) => (
                  <ListItem
                    key={scene.id}
                    title={scene.title || "Untitled Scene"}
                    secondaryText={`${scene.word_count || 0} words`} // Changed description to secondaryText
                    onClick={() => handleSceneSelect(scene)}
                    isSelected={selectedScene?.id === scene.id} // Changed isActive to isSelected
                  />
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No scenes in this chapter yet.
                </p>
              )}
            </ListContainer>
          </>
        )}
      </>
    );

    const mainDetailColumnContent = (
      <>
        {(() => {
          console.log(
            "[ProjectDashboardClient] In mainDetailColumnContent, checking selectedScene:",
            selectedScene
          );
          if (selectedScene) {
            console.log(
              "[ProjectDashboardClient] Rendering ManuscriptEditor for scene:",
              selectedScene.id,
              selectedScene.title
            );
            return (
              <div className="flex flex-col h-full items-center">
                <div className="text-center p-2">
                  <div className="flex items-center">
                    <h1
                      className={`text-2xl ${cactusSerif.className} font-bold mr-2`}
                    >
                      {selectedScene.title || "&nbsp;"}
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
                  </div>
                  <AISidePanel
                    isOpen={isAIPanelOpen}
                    onClose={() => setIsAIPanelOpen(false)}
                    title={`AI Assistant - ${selectedScene.title || "Scene"}`}
                    componentType="tool"
                    toolName="scene_helper"
                    defaultPrompt={`Help me improve this scene: ${
                      selectedScene.content || "Untitled Scene"
                    }`}
                    defaultSystemPrompt="You are a helpful writing assistant specialized in fiction. Help the user improve their scene by providing constructive feedback and suggestions."
                  />
                  <span className="text-sm italic text-gray-500">
                    {currentSceneWordCount} words
                  </span>
                </div>
                <ManuscriptEditor
                  key={selectedScene.id} // Add key to force re-render when scene changes
                  initialText={selectedScene.content || "&nbsp;"}
                  saveText={handleSaveSceneContent}
                  font={cactusSerif} // Use imported cactusSerif font
                  placeholder="Start writing your scene..."
                />
              </div>
            );
          } else {
            console.log(
              "[ProjectDashboardClient] selectedScene is null or undefined, rendering placeholder."
            );
            return (
              <div className="p-8 flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {manuscriptView === "scenes" && selectedChapter
                    ? "Select a scene to start writing."
                    : "Select a chapter and then a scene."}
                </p>
              </div>
            );
          }
        })()}
      </>
    );

    return (
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />
    );
  };

  const renderCharactersView = () => {
    const middleColumnContent = (
      <>
        <ContextualHeader
          title="Characters"
          navControls={
            <IconButton
              icon={PlusCircle}
              aria-label="New Character"
              onClick={handleOpenCreateCharacterModal}
            />
          }
        />
        <CharacterList
          characters={characters}
          selectedCharacterId={selectedCharacter?.id}
          onSelectCharacter={handleCharacterSelect}
          onCreateNewCharacter={handleOpenCreateCharacterModal}
          isLoading={isLoadingCharactersData}
        />
      </>
    );

    const mainDetailColumnContent = (
      <>
        {selectedCharacter ? (
          <CharacterCardEditor
            key={selectedCharacter.id} // Ensure re-render when character changes
            initialData={{
              id: selectedCharacter.id,
              name: selectedCharacter.name,
              description: selectedCharacter.description || "",
              notes: selectedCharacter.notes || "",
              image_url:
                typeof selectedCharacter.image_url === "string" ||
                selectedCharacter.image_url === null
                  ? selectedCharacter.image_url
                  : undefined,
            }}
            // projectId is not a prop of CharacterCardEditor, it's handled by data functions
            onSave={handleSaveCharacterEditorData}
            onDelete={() => handleCharacterDeleted(selectedCharacter.id)}
          />
        ) : (
          <div className="p-8 flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Select a character to view details, or create a new one.
            </p>
          </div>
        )}
      </>
    );

    return (
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />
    );
  };

  // Helper function to render World Notes view (now an arrow function within the component)
  const renderWorldNotesView = () => {
    // No longer need 'this' or casting, directly access state and props
    const middleColumnContent = (
      <>
        <ContextualHeader
          title="World Notes"
          navControls={
            <IconButton
              icon={PlusCircle}
              aria-label="New World Note"
              onClick={handleOpenCreateWorldNoteModal}
            />
          }
        />
        <WorldNoteList
          notes={worldNotes}
          selectedNoteId={selectedWorldNote?.id}
          onSelectNote={handleWorldNoteSelect}
          onCreateNewNote={handleOpenCreateWorldNoteModal}
          isLoading={isLoadingWorldNotesData}
        />
      </>
    );

    const mainDetailColumnContent = (
      <>
        {selectedWorldNote ? (
          <WorldNoteEditor
            key={selectedWorldNote.id}
            projectId={project.id}
            note={selectedWorldNote}
            onSave={handleSaveWorldNoteEditorData}
            onDelete={() => handleWorldNoteDeleted(selectedWorldNote.id)}
          />
        ) : (
          <div className="p-8 flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Select a world note to view details, or create a new one.
            </p>
          </div>
        )}
      </>
    );

    return (
      <SecondaryViewLayout
        middleColumn={middleColumnContent}
        mainDetailColumn={mainDetailColumnContent}
      />
    );
  };

  const handleSynopsisUpdate = (updatedData: {
    log_line?: string | null;
    one_page_synopsis?: string | null;
  }) => {
    setCurrentProjectDetails((prevDetails) => ({
      ...prevDetails,
      ...updatedData,
    }));
    // Optionally, you might want to inform the parent or trigger a global state update / re-fetch
    // For now, this updates the local copy used by ProjectSynopsisEditor if it were to re-render with this state.
  };

  const renderOutlineSynopsisView = () => {
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
              title: currentProjectDetails.title, // Add title
              genre_id: currentProjectDetails.genre_id, // Add genre_id
            }}
            onSynopsisUpdate={handleSynopsisUpdate}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mt-6 mb-2">
            Character Quick View
          </h3>
          {isLoadingCharactersData && characters.length === 0 ? ( // Show loading if actively fetching and no characters yet
            <Paragraph className="text-sm text-muted-foreground italic">
              Loading characters...
            </Paragraph>
          ) : (
            <CharacterCardQuickViewList characters={characters} />
          )}
        </div>
      </div>
    );
  };

  const renderOutlineScenesView = () => {
    // Placeholder for Scenes Outline View content
    // This will now render the ChapterSceneOutlineList component
    if (isLoadingChapters && chapters.length === 0) {
      return (
        <p className="p-4 text-sm text-muted-foreground">
          Loading outline data...
        </p>
      );
    }
    if (
      isLoadingCharactersData &&
      characters.length === 0 &&
      outlineView === "synopsis"
    ) {
      // Already handled by CharacterCardQuickViewList's internal loading/empty state for synopsis
    }

    // TODO: Add a handler for scene updates from ChapterSceneOutlineList
    const handleSceneOutlineUpdate = (
      chapterId: string,
      sceneId: string,
      updatedData: Partial<Scene>
    ) => {
      console.log(
        "Scene outline update triggered in ProjectDashboardClient:",
        `Chapter ID: ${chapterId}, Scene ID: ${sceneId}`,
        updatedData
      );

      setChapters((prevChapters) =>
        prevChapters.map((ch) => {
          if (ch.id === chapterId) {
            const existingScene = (ch.scenes || []).find(
              (sc) => sc.id === sceneId
            );
            if (existingScene) {
              // Update existing scene
              return {
                ...ch,
                scenes: (ch.scenes || []).map((sc) =>
                  sc.id === sceneId ? { ...sc, ...updatedData } : sc
                ),
              };
            } else {
              // Add new scene (updatedData is the new Scene object)
              // Ensure the new scene has all required fields from Scene type
              const newScene = updatedData as Scene;
              return {
                ...ch,
                scenes: [...(ch.scenes || []), newScene].sort(
                  (a, b) => a.order - b.order
                ),
              };
            }
          }
          return ch;
        })
      );
      // Toasting success here might be premature if the API call (done in modal) fails.
      // The modal itself handles success/error toasts for the API call.
      // This handler is purely for local state update.
      // toast.success("Scene details updated locally.");
    };

    return (
      <ChapterSceneOutlineList
        chapters={chapters} // Ensure chapters include scenes with outline fields
        characters={characters}
        sceneTags={allSceneTags} // Pass fetched scene tags
        projectId={project.id}
        onSceneUpdate={handleSceneOutlineUpdate}
        // isLoadingSceneTags={isLoadingAllSceneTags} // Pass loading state
      />
    );
  };

  const renderOutlineView = () => {
    const middleColumnContent = (
      <>
        <ContextualHeader title="Outline Sections" />
        <ListContainer>
          <ListItem
            title="Synopsis"
            icon={FileText} // Pass LucideIcon component type directly
            onClick={() => setOutlineView("synopsis")}
            isSelected={outlineView === "synopsis"}
            // description="Edit project log line and one-page synopsis."
          />
          <ListItem
            title="Scenes"
            icon={ClipboardList} // Pass LucideIcon component type directly
            onClick={() => setOutlineView("scenes")}
            isSelected={outlineView === "scenes"}
            // description="Manage detailed scene-by-scene outline."
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
  };

  return (
    <>
      {activeSection === "manuscript" && renderManuscriptView()}
      {activeSection === "outline" && renderOutlineView()}
      {activeSection === "characters" && renderCharactersView()}
      {activeSection === "world-notes" && renderWorldNotesView()}
      {activeSection === "ai" && (
        <div className="p-4">AI Assistant View (Not Implemented)</div>
      )}
      {/* Settings and Export might be modals or separate pages, handled differently */}

      {isCreateChapterModalOpen && (
        <CreateChapterModal
          projectId={project.id}
          isOpen={isCreateChapterModalOpen}
          onClose={() => setIsCreateChapterModalOpen(false)}
          onChapterCreated={(newChapter) => {
            setChapters((prev) =>
              [...prev, newChapter].sort((a, b) => a.order - b.order)
            );
            setIsCreateChapterModalOpen(false);
          }}
        />
      )}

      {isCreateSceneModalOpen && selectedChapter && (
        <CreateSceneModal
          projectId={project.id}
          chapterId={selectedChapter.id}
          isOpen={isCreateSceneModalOpen}
          onClose={() => setIsCreateSceneModalOpen(false)}
          onSceneCreated={(newScene) => {
            setScenesForSelectedChapter((prev) =>
              [...prev, newScene].sort((a, b) => a.order - b.order)
            );
            setIsCreateSceneModalOpen(false);
          }}
        />
      )}

      {isCreateCharacterModalOpen && (
        <CreateCharacterModal
          projectId={project.id}
          isOpen={isCreateCharacterModalOpen}
          onClose={() => setIsCreateCharacterModalOpen(false)}
          onCharacterCreated={handleCharacterCreated}
        />
      )}

      {isCreateWorldNoteModalOpen && (
        <CreateWorldNoteModal
          projectId={project.id}
          isOpen={isCreateWorldNoteModalOpen}
          onClose={() => setIsCreateWorldNoteModalOpen(false)}
          onNoteCreated={handleWorldNoteCreated}
        />
      )}
    </>
  );
}
