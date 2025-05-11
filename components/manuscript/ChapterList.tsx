"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { ListContainer } from "@/components/ui/ListContainer";
import { ListItem } from "@/components/ui/ListItem";
import { ListSectionHeader } from "@/components/ui/ListSectionHeader";
import { IconButton } from "@/components/ui/IconButton";
import { getChaptersByProjectId } from "@/lib/data/chapters";
import type { Chapter } from "@/lib/types";
import { toast } from "sonner";
// TODO: Import a Modal component for adding chapters
// import { CreateChapterModal } from "./CreateChapterModal"; // Assuming this will be created

// interface ChapterListProps {
// Props to be defined
// }

export function ChapterList(/*{}: ChapterListProps*/) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [isModalOpen, setIsModalOpen] = useState(false); // Commented out as unused for now
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (projectId) {
      const fetchChapters = async () => {
        setIsLoading(true);
        try {
          const fetchedChapters = await getChaptersByProjectId(projectId);
          setChapters(fetchedChapters);
          if (fetchedChapters.length > 0 && !selectedChapterId) {
            // Automatically select the first chapter if none is selected
            // setSelectedChapterId(fetchedChapters[0].id);
            // router.push(`/project/${projectId}/manuscript/chapter/${fetchedChapters[0].id}`);
          }
        } catch (error) {
          console.error("Failed to fetch chapters:", error);
          toast.error("Failed to load chapters.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchChapters();
    }
  }, [projectId, router, selectedChapterId]);

  const handleAddChapter = () => {
    // setIsModalOpen(true); // Commented out as unused for now
    toast.info("Add chapter functionality will be implemented here.");
  };

  const handleChapterClick = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    // Navigate to scene list for this chapter
    // router.push(`/project/${projectId}/manuscript/chapter/${chapterId}`);
    toast.info(
      `Chapter ${chapterId} clicked. Scene list view will be implemented.`
    );
  };

  // TODO: Implement CreateChapterModal and its handler
  // const handleChapterCreated = (newChapter: Chapter) => {
  //   setChapters((prevChapters) => [...prevChapters, newChapter]);
  //   setIsModalOpen(false);
  //   setSelectedChapterId(newChapter.id);
  //   router.push(`/project/${projectId}/manuscript/chapter/${newChapter.id}`);
  // };

  if (isLoading) {
    return <ListContainer>Loading chapters...</ListContainer>;
  }

  return (
    <>
      <ListSectionHeader
        title="Chapters"
        actionElement={
          <IconButton
            onClick={handleAddChapter}
            aria-label="Add new chapter"
            variant="ghost"
            size="sm"
            icon={PlusIcon}
          />
        }
      />
      <ListContainer>
        {chapters.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No chapters yet. Click the + button to add your first chapter.
          </p>
        ) : (
          chapters.map((chapter) => (
            <ListItem
              key={chapter.id}
              title={chapter.title || "Untitled Chapter"}
              // TODO: Add scene count and word count once available in Chapter type
              // secondaryText={`${chapter.sceneCount || 0} scenes · ${chapter.wordCount || 0} words`}
              secondaryText={`Order: ${chapter.order}`}
              onClick={() => handleChapterClick(chapter.id)}
              isSelected={chapter.id === selectedChapterId}
            />
          ))
        )}
      </ListContainer>
      {/* {isModalOpen && ( // Commented out as unused for now
        <CreateChapterModal
          projectId={projectId}
          onClose={() => setIsModalOpen(false)} // Commented out as unused for now
          onChapterCreated={handleChapterCreated}
        />
      )} */}
    </>
  );
}
