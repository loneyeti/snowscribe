"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getNoteSuggestions, generateNoteTitleForContent } from "@/lib/data/ai";
import { appEvents } from "@/lib/utils/eventEmitter";

interface UseCreateWorldNoteFromChatProps {
  projectId: string;
}

interface InitialNoteData {
  title: string;
  category: string;
  content: string;
}

export function useCreateWorldNoteFromChat({ projectId }: UseCreateWorldNoteFromChatProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [initialNoteData, setInitialNoteData] = useState<InitialNoteData>({
    title: "",
    category: "",
    content: "",
  });

  const openCreateNoteModal = useCallback(
    async (content: string, category?: string) => {
      setIsModalOpen(true);
      setIsSuggesting(true);
      toast.info("Getting AI suggestions for your note...");

      try {
        if (category) {
          // Case 1: Category is provided, just get the title
          setInitialNoteData({ content, category, title: "" });
          const suggestion = await generateNoteTitleForContent(
            projectId,
            content,
            category
          );
          if (suggestion.title) {
            appEvents.emit('creditsUpdated'); // ADD THIS LINE
            setInitialNoteData((prev) => ({ ...prev, title: suggestion.title }));
            toast.success("AI suggestions loaded!");
          } else {
            toast.error("Could not get an AI suggestion for the title.");
          }
        } else {
          // Case 2: No category provided, get both title and category (for World Building Chat)
          setInitialNoteData({ content, category: "", title: "" });
          const suggestions = await getNoteSuggestions(projectId, content);
          if (suggestions.title || suggestions.category) {
            appEvents.emit('creditsUpdated'); // ADD THIS LINE
            setInitialNoteData((prev) => ({
              ...prev,
              title: suggestions.title,
              category: suggestions.category,
            }));
            toast.success("AI suggestions loaded!");
          } else {
            toast.error("Could not get AI suggestions.");
          }
        }
      } catch (error) {
        console.error("Failed to get AI suggestions:", error);
        toast.error("An error occurred while getting AI suggestions.");
      } finally {
        setIsSuggesting(false);
      }
    },
    [projectId]
  );

  const closeCreateNoteModal = useCallback(() => {
    setIsModalOpen(false);
    setInitialNoteData({ title: "", category: "", content: "" });
  }, []);

  return {
    isModalOpen,
    isSuggesting,
    initialNoteData,
    openCreateNoteModal,
    closeCreateNoteModal,
  };
}
