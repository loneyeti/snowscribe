"use client";
import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { useAIChat } from "@/hooks/ai/useAIChat";
import { Paragraph } from "@/components/typography/Paragraph";
import { MultiTurnChatInterface } from "@/components/ai/MultiTurnChatInterface";
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import { toast } from "sonner";
import { PlusSquare } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { AIMessage } from "@/lib/types";

export function WorldBuildingChat() {
  const { project, worldNotes, isStoreLoading, createWorldNote } =
    useProjectStore(
      useShallow((state) => ({
        project: state.project,
        worldNotes: state.worldNotes,
        isStoreLoading: state.isLoading,
        createWorldNote: state.createWorldNote,
      }))
    );

  const projectId = project?.id || "placeholder-project-id";
  const { uiMessages, isLoading, error, sendUserMessage } =
    useAIChat(projectId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialNoteContent, setInitialNoteContent] = useState<string>("");

  const handleSendMessage = async (userText: string) => {
    if (isStoreLoading.worldNotes) {
      toast.error("World notes data is not yet loaded.");
      return;
    }
    const contextForAI = { notes: worldNotes };
    await sendUserMessage(
      userText,
      AI_TOOL_NAMES.WORLD_BUILDING_CHAT,
      contextForAI
    );
  };

  const openCreateNoteModal = (content: string) => {
    setInitialNoteContent(content);
    setIsModalOpen(true);
  };

  const renderMessageActions = (message: AIMessage) => {
    if (message.sender !== "ai" || !message.text) return null;

    return (
      <IconButton
        icon={PlusSquare}
        onClick={() => openCreateNoteModal(message.text)}
        aria-label="Create world note from this response"
        title="Create world note"
        variant="ghost"
        size="sm"
      />
    );
  };

  if (isStoreLoading.worldNotes) {
    return <Paragraph>Loading world notes...</Paragraph>;
  }

  return (
    <>
      <MultiTurnChatInterface
        uiMessages={uiMessages}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
        className="h-full"
        renderMessageActions={renderMessageActions}
      />

      <CreateWorldNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialContent={initialNoteContent}
      />
    </>
  );
}
