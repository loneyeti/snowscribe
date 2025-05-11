"use client";

import React, { useState, useEffect } from "react";
// Import all types directly from @/lib/types
import type { Project, Chapter, Genre, Scene } from "@/lib/types";
import { getChaptersByProjectId } from "@/lib/data/chapters";
import { getScenesByChapterId } from "@/lib/data/scenes";
import { toast } from "sonner";
import { Geist } from "next/font/google"; // Import Geist
import { countWords } from "@/lib/utils"; // Import countWords
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
// import { ListSectionHeader } from "@/components/ui/ListSectionHeader"; // Removed as it's not used yet
import { ContextualHeader } from "@/components/ui/ContextualHeader";
// import { ContextualNavControls } from "@/components/ui/ContextualNavControls"; // Removed as it's not used directly
import { IconButton } from "@/components/ui/IconButton";
import { ManuscriptEditor } from "@/components/editors/ManuscriptEditor";
import { CreateChapterModal } from "@/components/manuscript/CreateChapterModal";
import { CreateSceneModal } from "@/components/manuscript/CreateSceneModal"; // Import the new modal
import { PlusCircle, ArrowLeft } from "lucide-react";

// Define view states for the manuscript section
type ManuscriptView = "chapters" | "scenes";

// Initialize Geist Sans font
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

interface ProjectDashboardClientProps {
  project: Project & { genres: Genre | null };
  // initialChapters: Chapter[]; // Will fetch chapters internally
  // We might pass initial scenes for the first chapter or handle fetching them
}

export function ProjectDashboardClient({
  project,
}: ProjectDashboardClientProps) {
  const [activeSection, setActiveSection] = useState<string>("manuscript"); // 'manuscript', 'outline', etc.
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
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isCreateChapterModalOpen, setIsCreateChapterModalOpen] =
    useState(false);
  const [isCreateSceneModalOpen, setIsCreateSceneModalOpen] = useState(false);

  const fetchProjectChapters = async () => {
    setIsLoadingChapters(true);
    try {
      const fetchedChapters = await getChaptersByProjectId(project.id);
      setChapters(fetchedChapters);
      // Optionally, select the first chapter automatically
      // if (fetchedChapters.length > 0 && !selectedChapter) {
      //   handleChapterSelect(fetchedChapters[0]);
      // }
    } catch (error) {
      console.error("Failed to fetch chapters:", error);
      toast.error("Failed to load chapters.");
    } finally {
      setIsLoadingChapters(false);
    }
  };

  useEffect(() => {
    if (
      project.id &&
      activeSection === "manuscript" &&
      manuscriptView === "chapters"
    ) {
      fetchProjectChapters();
    }
  }, [project.id, activeSection, manuscriptView]); // Removed fetchProjectChapters from deps array as it's defined outside

  // This function will be passed to PrimarySidebar later or handled by routing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Reset manuscript specific views when changing main section
    if (sectionId !== "manuscript") {
      setManuscriptView("chapters");
      setSelectedChapter(null);
      setSelectedScene(null);
      setScenesForSelectedChapter([]);
    }
  };

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
              <div className="flex flex-col h-full">
                <ManuscriptEditor
                  key={selectedScene.id} // Add key to force re-render when scene changes
                  initialText={selectedScene.content || "&nbsp;"}
                  saveText={handleSaveSceneContent}
                  font={geistSans} // Use imported Geist Sans font
                  placeholder="Start writing your scene..."
                />
                <div className="p-2 border-t text-sm text-muted-foreground">
                  Word Count: {currentSceneWordCount}
                </div>
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

  // Main render based on activeSection
  // For now, only manuscript is partially implemented
  return (
    <>
      {activeSection === "manuscript" && renderManuscriptView()}
      {activeSection === "outline" && (
        <div className="p-4">Outline View (Not Implemented)</div>
      )}
      {activeSection === "characters" && (
        <div className="p-4">Characters View (Not Implemented)</div>
      )}
      {activeSection === "world" && (
        <div className="p-4">World Notes View (Not Implemented)</div>
      )}
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
            // Add to local state and optionally select
            setChapters((prev) =>
              [...prev, newChapter].sort((a, b) => a.order - b.order)
            );
            // Or refetch all chapters:
            // fetchProjectChapters();
            // handleChapterSelect(newChapter); // Optionally auto-select new chapter
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
            // Optionally auto-select new scene
            // handleSceneSelect(newScene);
            setIsCreateSceneModalOpen(false);
          }}
        />
      )}
    </>
  );
}
