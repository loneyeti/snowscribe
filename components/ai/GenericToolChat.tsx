"use client";

import React, { useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { useAIChat } from "@/hooks/ai/useAIChat";
import { MultiTurnChatInterface } from "@/components/ai/MultiTurnChatInterface";
import { Paragraph } from "@/components/typography/Paragraph";
import { toast } from "sonner";
import { AIToolDefinition, AI_TOOL_NAMES } from "@/lib/ai/constants";
import { useCreateWorldNoteFromChat } from "@/hooks/ai/useCreateWorldNoteFromChat";
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";
import { PlusSquare } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { AIMessage } from "@/lib/types";

interface GenericToolChatProps {
  tool: AIToolDefinition;
  projectId: string;
}

export function GenericToolChat({ tool, projectId }: GenericToolChatProps) {
  // 1. Fetch required project data from the Zustand store
  const { chapters, characters, sceneTags, isStoreLoading } = useProjectStore(
    useShallow((state) => ({
      chapters: state.chapters,
      characters: state.characters,
      sceneTags: state.sceneTags,
      isStoreLoading: state.isLoading,
    }))
  );

  // 2. Initialize the chat hook, scoped to the current project
  const {
    uiMessages,
    isLoading: isChatLoading,
    error: chatError,
    sendUserMessage,
    clearChat,
  } = useAIChat(projectId);

  // 3. Clear the chat history whenever the selected tool changes
  useEffect(() => {
    clearChat();
  }, [tool, clearChat]);

  const {
    isModalOpen,
    isSuggesting,
    initialNoteData,
    openCreateNoteModal,
    closeCreateNoteModal,
  } = useCreateWorldNoteFromChat({ projectId });

  // 4. Define the message sending logic
  const handleSendMessage = useCallback(
    async (userText: string) => {
      let contextForAI: object | null = null;
      let isDataReady = true;

      // Assemble the context based on the specific tool being used
      switch (tool.id) {
        case AI_TOOL_NAMES.MANUSCRIPT_CHAT:
          if (isStoreLoading.chapters) {
            toast.error("Manuscript data is still loading. Please wait.");
            isDataReady = false;
            break;
          }
          contextForAI = { chapters };
          break;

        case AI_TOOL_NAMES.OUTLINE_CHAT:
          if (
            isStoreLoading.chapters ||
            isStoreLoading.characters ||
            isStoreLoading.sceneTags
          ) {
            toast.error("Outline data is still loading. Please wait.");
            isDataReady = false;
            break;
          }
          contextForAI = { chapters, characters, sceneTags };
          break;

        case AI_TOOL_NAMES.WRITING_COACH:
          // No project context is needed for the writing coach
          contextForAI = null;
          break;

        default:
          toast.error(`Tool "${tool.name}" is not configured for chat.`);
          isDataReady = false;
      }

      if (isDataReady) {
        await sendUserMessage(userText, tool.id, contextForAI);
      }
    },
    [tool, chapters, characters, sceneTags, isStoreLoading, sendUserMessage]
  );

  // 5. Render loading indicators or the chat interface
  const isLoadingContext =
    (tool.id === AI_TOOL_NAMES.MANUSCRIPT_CHAT && isStoreLoading.chapters) ||
    (tool.id === AI_TOOL_NAMES.OUTLINE_CHAT &&
      (isStoreLoading.chapters ||
        isStoreLoading.characters ||
        isStoreLoading.sceneTags));

  if (isLoadingContext) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Paragraph>Loading context data for {tool.name}...</Paragraph>
      </div>
    );
  }

  const renderMessageActions = (message: AIMessage) => {
    if (message.sender !== "ai" || !message.text) {
      return null;
    }

    return (
      <IconButton
        icon={PlusSquare}
        onClick={() => openCreateNoteModal(message.text, tool.name)}
        aria-label="Create world note from this response"
        title="Create world note"
        variant="ghost"
        size="sm"
      />
    );
  };

  return (
    <>
      <MultiTurnChatInterface
        uiMessages={uiMessages}
        isLoading={isChatLoading}
        error={chatError}
        onSendMessage={handleSendMessage}
        className="flex-grow"
        renderMessageActions={renderMessageActions}
      />
      <CreateWorldNoteModal
        isOpen={isModalOpen}
        onClose={closeCreateNoteModal}
        initialContent={initialNoteData.content}
        initialTitle={initialNoteData.title}
        initialCategory={initialNoteData.category}
        isSuggesting={isSuggesting}
      />
    </>
  );
}
