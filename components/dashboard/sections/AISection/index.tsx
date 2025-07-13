"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Project,
  Chapter,
  Character as ProjectCharacter,
  Scene,
  SceneTag,
  WorldBuildingNote,
  AIMessage,
} from "@/lib/types";
import { useProjectStore } from "@/lib/stores/projectStore";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { AIToolSelector } from "@/components/ai/AIToolSelector";
import {
  MultiTurnChatInterface,
  CustomAction,
} from "@/components/ai/MultiTurnChatInterface";
import { CharacterNameGeneratorForm } from "@/components/ai/CharacterNameGeneratorForm";

import { useAIChat } from "@/hooks/ai/useAIChat";
import {
  AI_PAGE_TOOLS,
  AIToolName,
  AI_TOOL_NAMES,
  AIToolDefinition,
} from "@/lib/ai/constants";
import { Paragraph } from "@/components/typography/Paragraph";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";

interface AISectionProps {
  project: Project & { genres: import("@/lib/types").Genre | null };
}

export function AISection({ project }: AISectionProps) {
  const [selectedTool, setSelectedTool] = useState<AIToolName | null>(null);
  const [activeToolDefinition, setActiveToolDefinition] =
    useState<AIToolDefinition | null>(null);

  const {
    uiMessages,
    isLoading: isChatLoading,
    error: chatError,
    sendUserMessage,
    clearChat,
    setUiMessages,
  } = useAIChat(project.id);

  // State for fetched context data
  const {
    chapters,
    characters,
    worldNotes,
    sceneTags,
    isLoading: isStoreLoading,
  } = useProjectStore();

  const [selectedCharacterForChat, setSelectedCharacterForChat] =
    useState<ProjectCharacter | null>(null);
  const [allScenesForSelectedChar, setAllScenesForSelectedChar] = useState<
    Scene[] | null
  >(null);

  const [plotHoleContextType, setPlotHoleContextType] = useState<
    "manuscript" | "outline" | null
  >(null);

  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  const handleToolSelect = useCallback(
    (toolId: AIToolName) => {
      setSelectedTool(toolId);
      const toolDef = AI_PAGE_TOOLS.find((t) => t.id === toolId) || null;
      setActiveToolDefinition(toolDef);
      clearChat();
      setSelectedCharacterForChat(null);
      setPlotHoleContextType(null);
    },
    [clearChat]
  );

  // Fetch character scenes
  useEffect(() => {
    if (
      selectedTool !== AI_TOOL_NAMES.CHARACTER_CHAT ||
      !selectedCharacterForChat
    ) {
      setAllScenesForSelectedChar(null);
      return;
    }
    const scenesCharacterIsIn: Scene[] = [];
    chapters.forEach((chapter) => {
      chapter.scenes?.forEach((scene) => {
        const isPov = scene.pov_character_id === selectedCharacterForChat.id;
        const isOther = scene.scene_characters?.some(
          (char) => char.character_id === selectedCharacterForChat.id
        );
        if (isPov || isOther) {
          scenesCharacterIsIn.push(scene);
        }
      });
    });
    setAllScenesForSelectedChar(scenesCharacterIsIn);
  }, [selectedTool, selectedCharacterForChat, chapters]);

  const handleSendMessageWrapper = async (userText: string) => {
    if (!selectedTool || !activeToolDefinition) {
      toast.error("No AI tool selected.");
      return;
    }

    let contextForAI: object | null = null;
    let toolNameToUseInAIService = selectedTool;

    switch (selectedTool) {
      case AI_TOOL_NAMES.MANUSCRIPT_CHAT:
        if (isStoreLoading.chapters) {
          toast.error("Manuscript data not loaded.");
          return;
        }
        contextForAI = { chapters };
        break;
      case AI_TOOL_NAMES.OUTLINE_CHAT:
        if (
          isStoreLoading.chapters ||
          isStoreLoading.characters ||
          isStoreLoading.sceneTags
        ) {
          toast.error("Outline data not loaded.");
          return;
        }
        contextForAI = { chapters, characters, sceneTags };
        break;
      case AI_TOOL_NAMES.CHARACTER_CHAT:
        if (!selectedCharacterForChat) {
          toast.error("Please select a character to chat with.");
          return;
        }
        // Check if the scene context is still loading or hasn't been fetched
        if (allScenesForSelectedChar === null) {
          toast.info(
            `Scene context for ${selectedCharacterForChat.name} is loading. Please wait.`
          );
          return;
        }
        contextForAI = {
          character: selectedCharacterForChat,
          relatedScenes: allScenesForSelectedChar,
        };
        toolNameToUseInAIService = AI_TOOL_NAMES.CHARACTER_CHAT;
        break;
      case AI_TOOL_NAMES.WORLD_BUILDING_CHAT:
        if (isStoreLoading.worldNotes) {
          toast.error("World notes not loaded.");
          return;
        }
        contextForAI = { notes: worldNotes };
        break;
      case AI_TOOL_NAMES.PLOT_HOLE_CHECKER:
        if (!plotHoleContextType) {
          toast.error(
            "Please select context (Manuscript/Outline) for Plot Hole Checker."
          );
          return;
        }
        if (plotHoleContextType === "manuscript") {
          if (isStoreLoading.chapters) {
            toast.error("Manuscript data not loaded for Plot Hole Checker.");
            return;
          }
          contextForAI = { chapters };
          toolNameToUseInAIService = AI_TOOL_NAMES.PLOT_HOLE_CHECKER_MANUSCRIPT;
        } else {
          if (
            isStoreLoading.chapters ||
            isStoreLoading.characters ||
            isStoreLoading.sceneTags
          ) {
            toast.error("Outline data not loaded for Plot Hole Checker.");
            return;
          }
          contextForAI = { chapters, characters, sceneTags };
          toolNameToUseInAIService = AI_TOOL_NAMES.PLOT_HOLE_CHECKER_OUTLINE;
        }
        break;
      case AI_TOOL_NAMES.WRITING_COACH:
        break;
      default:
        toast.error(
          "This tool does not use the standard chat interface for sending messages directly."
        );
        return;
    }
    await sendUserMessage(userText, toolNameToUseInAIService, contextForAI);
  };

  const handlePlotHoleCheckTrigger = async () => {
    if (!plotHoleContextType) {
      toast.error(
        "Please select manuscript or outline to check for plot holes."
      );
      return;
    }
    if (
      (plotHoleContextType === "manuscript" && isStoreLoading.chapters) ||
      (plotHoleContextType === "outline" &&
        (isStoreLoading.chapters ||
          isStoreLoading.characters ||
          isStoreLoading.sceneTags))
    ) {
      toast.info("Context data is still loading. Please wait and try again.");
      return;
    }

    // Prevent multiple simultaneous requests
    if (isChatLoading) {
      toast.info("Analysis is already in progress. Please wait.");
      return;
    }

    const plotHolePrompt = `Analyze the provided ${plotHoleContextType} for potential plot holes, inconsistencies, or unresolved questions. Provide a list of your findings.`;
    clearChat();
    await handleSendMessageWrapper(plotHolePrompt);
  };

  const handleCharacterSelectForChat = (character: ProjectCharacter) => {
    setSelectedCharacterForChat(character);
    setAllScenesForSelectedChar(null); // Reset scene context when selecting a new character
    clearChat();
    setUiMessages([
      {
        id: Date.now().toString(),
        text: `You are now chatting with ${character.name}. What would you like to ask or discuss?`,
        sender: "system",
        type: "info",
        timestamp: new Date(),
      },
    ]);
  };

  const handleCreateWorldNoteFromChat = (selectedMessages: AIMessage[]) => {
    const lastAiMessage = selectedMessages
      .filter((m) => m.sender === "ai")
      .pop();
    if (lastAiMessage) {
      setIsCreateWorldNoteModalOpen(true);
    } else {
      toast.info("No AI message selected or available to create a note from.");
    }
  };

  const worldBuildingChatActions: CustomAction[] = [
    {
      label: "Create World Note From Last AI Response",
      onAction: (messages: AIMessage[]) =>
        handleCreateWorldNoteFromChat(messages),
      isVisible: (messages: AIMessage[]) =>
        messages.some((m) => m.sender === "ai"),
    },
  ];

  const middleColumn = (
    <AIToolSelector
      tools={AI_PAGE_TOOLS}
      selectedToolId={selectedTool}
      onSelectTool={handleToolSelect}
    />
  );

  const mainDetailColumn = (
    <div className="p-4 h-full flex flex-col">
      {!activeToolDefinition && (
        <div className="flex-grow flex items-center justify-center">
          <Paragraph className="text-muted-foreground text-lg">
            Select an AI tool from the list to get started.
          </Paragraph>
        </div>
      )}
      {activeToolDefinition && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">
              {activeToolDefinition.name}
            </h2>
            <Paragraph className="text-muted-foreground">
              {activeToolDefinition.description}
            </Paragraph>
          </div>

          {isStoreLoading.chapters &&
            selectedTool !== AI_TOOL_NAMES.WRITING_COACH &&
            selectedTool !== AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR && (
              <Paragraph>Loading context data...</Paragraph>
            )}

          {/* Manuscript Chat */}
          {selectedTool === AI_TOOL_NAMES.MANUSCRIPT_CHAT &&
            !isStoreLoading.chapters && (
              <MultiTurnChatInterface
                uiMessages={uiMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={handleSendMessageWrapper}
                className="flex-grow"
              />
            )}

          {/* Outline Chat */}
          {selectedTool === AI_TOOL_NAMES.OUTLINE_CHAT &&
            !isStoreLoading.chapters &&
            !isStoreLoading.characters &&
            !isStoreLoading.sceneTags && (
              <MultiTurnChatInterface
                uiMessages={uiMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={handleSendMessageWrapper}
                className="flex-grow"
              />
            )}

          {/* Character Chat */}
          {selectedTool === AI_TOOL_NAMES.CHARACTER_CHAT &&
            !isStoreLoading.characters && (
              <div className="flex flex-col flex-grow">
                {!selectedCharacterForChat &&
                  characters &&
                  characters.length > 0 && (
                    <div className="mb-4">
                      <Paragraph className="mb-2">
                        Select a character to chat with:
                      </Paragraph>
                      <div className="flex flex-wrap gap-2">
                        {characters.map((char) => (
                          <Button
                            key={char.id}
                            variant="outline"
                            onClick={() => handleCharacterSelectForChat(char)}
                          >
                            {char.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                {!selectedCharacterForChat &&
                  characters &&
                  characters.length === 0 && (
                    <Paragraph>
                      No characters found. Create characters in the Characters
                      section.
                    </Paragraph>
                  )}
                {!selectedCharacterForChat && !characters && (
                  <Paragraph>Loading characters...</Paragraph>
                )}
                {selectedCharacterForChat &&
                  (isStoreLoading.chapters ||
                    allScenesForSelectedChar === null) && (
                    <Paragraph className="text-center p-4">
                      Loading all scene context for{" "}
                      {selectedCharacterForChat.name}...
                    </Paragraph>
                  )}

                {selectedCharacterForChat &&
                  !isStoreLoading.chapters &&
                  allScenesForSelectedChar !== null && (
                    <MultiTurnChatInterface
                      uiMessages={uiMessages}
                      isLoading={isChatLoading}
                      error={chatError}
                      onSendMessage={handleSendMessageWrapper}
                      className="flex-grow"
                    />
                  )}
              </div>
            )}

          {/* World Building Chat */}
          {selectedTool === AI_TOOL_NAMES.WORLD_BUILDING_CHAT &&
            !isStoreLoading.worldNotes && (
              <MultiTurnChatInterface
                uiMessages={uiMessages}
                isLoading={isChatLoading}
                error={chatError}
                onSendMessage={handleSendMessageWrapper}
                customActions={worldBuildingChatActions}
                className="flex-grow"
              />
            )}

          {/* Writing Coach */}
          {selectedTool === AI_TOOL_NAMES.WRITING_COACH && (
            <MultiTurnChatInterface
              uiMessages={uiMessages}
              isLoading={isChatLoading}
              error={chatError}
              onSendMessage={handleSendMessageWrapper}
              className="flex-grow"
            />
          )}

          {/* Character Name Generator */}
          {selectedTool === AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR && (
            <CharacterNameGeneratorForm projectId={project.id} />
          )}

          {/* Plot Hole Checker */}
          {selectedTool === AI_TOOL_NAMES.PLOT_HOLE_CHECKER && (
            <div className="flex flex-col flex-grow">
              <div className="mb-4 flex items-center space-x-2">
                <Paragraph>Analyze:</Paragraph>
                <Button
                  variant={
                    plotHoleContextType === "manuscript" ? "default" : "outline"
                  }
                  onClick={() => {
                    setPlotHoleContextType("manuscript");
                    clearChat();
                  }}
                >
                  Manuscript
                </Button>
                <Button
                  variant={
                    plotHoleContextType === "outline" ? "default" : "outline"
                  }
                  onClick={() => {
                    setPlotHoleContextType("outline");
                    clearChat();
                  }}
                >
                  Outline
                </Button>
                <Button
                  onClick={handlePlotHoleCheckTrigger}
                  disabled={!plotHoleContextType || isChatLoading}
                >
                  {isChatLoading ? "Analyzing..." : "Check for Plot Holes"}
                </Button>
                {isChatLoading && (
                  <Paragraph className="text-sm text-muted-foreground ml-2">
                    This may take a moment...
                  </Paragraph>
                )}
              </div>
              {plotHoleContextType && !isStoreLoading.chapters && (
                <MultiTurnChatInterface
                  uiMessages={uiMessages}
                  isLoading={isChatLoading}
                  error={chatError}
                  onSendMessage={handleSendMessageWrapper}
                  className="flex-grow"
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumn}
        mainDetailColumn={mainDetailColumn}
      />
      {isCreateWorldNoteModalOpen && (
        <CreateWorldNoteModal
          isOpen={isCreateWorldNoteModalOpen}
          onClose={() => setIsCreateWorldNoteModalOpen(false)}
        />
      )}
    </>
  );
}
