"use client";

import React, { useState, useEffect, useCallback } from "react";
import type {
  Project,
  Chapter,
  Character as ProjectCharacter,
  SceneTag,
  WorldBuildingNote,
  AIMessage,
} from "@/lib/types";
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

import { getChaptersByProjectId } from "@/lib/data/chapters";
import { getCharacters } from "@/lib/data/characters";
import { useProjectData } from "@/contexts/ProjectDataContext";
import { getWorldBuildingNotes } from "@/lib/data/worldBuildingNotes";
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";

interface AISectionProps {
  project: Project & { genres: SceneTag | null };
  isActive: boolean;
}

export function AISection({ project, isActive }: AISectionProps) {
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
  const [manuscriptChapters, setManuscriptChapters] = useState<
    Chapter[] | null
  >(null);
  const [outlineData, setOutlineData] = useState<{
    chapters: Chapter[];
    characters: ProjectCharacter[];
    sceneTags: SceneTag[];
  } | null>(null);
  const [charactersForChat, setCharactersForChat] = useState<
    ProjectCharacter[] | null
  >(null);
  const [selectedCharacterForChat, setSelectedCharacterForChat] =
    useState<ProjectCharacter | null>(null);
  const [worldNotes, setWorldNotes] = useState<WorldBuildingNote[] | null>(
    null
  );
  const [plotHoleContextType, setPlotHoleContextType] = useState<
    "manuscript" | "outline" | null
  >(null);
  const [isContextLoading, setIsContextLoading] = useState(false);

  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  const { allSceneTags } = useProjectData();

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

  useEffect(() => {
    if (!isActive) {
      setSelectedTool(null);
      setActiveToolDefinition(null);
      clearChat();
      setManuscriptChapters(null);
      setOutlineData(null);
      // Keep charactersForChat if already loaded and user might switch back quickly
      // setCharactersForChat(null);
      setSelectedCharacterForChat(null);
      setWorldNotes(null);
      setPlotHoleContextType(null);
      setIsContextLoading(false); // Reset loading state
    }
  }, [isActive, clearChat]);

  useEffect(() => {
    if (
      !isActive ||
      !selectedTool ||
      (selectedTool === AI_TOOL_NAMES.PLOT_HOLE_CHECKER && !plotHoleContextType)
    ) {
      return;
    }

    const fetchContextData = async () => {
      setIsContextLoading(true);
      toast.info("Loading context data...");
      try {
        if (
          selectedTool === AI_TOOL_NAMES.MANUSCRIPT_CHAT ||
          (selectedTool === AI_TOOL_NAMES.PLOT_HOLE_CHECKER &&
            plotHoleContextType === "manuscript")
        ) {
          if (!manuscriptChapters || plotHoleContextType === "manuscript") {
            const chapters = await getChaptersByProjectId(project.id);
            setManuscriptChapters(chapters);
          }
        } else if (
          selectedTool === AI_TOOL_NAMES.OUTLINE_CHAT ||
          (selectedTool === AI_TOOL_NAMES.PLOT_HOLE_CHECKER &&
            plotHoleContextType === "outline")
        ) {
          if (!outlineData || plotHoleContextType === "outline") {
            const chapters = await getChaptersByProjectId(project.id);
            const charactersList = await getCharacters(project.id);
            setOutlineData({
              chapters,
              characters: charactersList,
              sceneTags: allSceneTags,
            });
          }
        } else if (selectedTool === AI_TOOL_NAMES.CHARACTER_CHAT) {
          if (!charactersForChat) {
            const chars = await getCharacters(project.id);
            setCharactersForChat(chars);
          }
        } else if (selectedTool === AI_TOOL_NAMES.WORLD_BUILDING_CHAT) {
          if (!worldNotes) {
            const notes = await getWorldBuildingNotes(project.id);
            setWorldNotes(notes);
          }
        }
        toast.success("Context data loaded.");
      } catch (err) {
        console.error("Failed to fetch context data:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to load context for AI tool."
        );
      } finally {
        setIsContextLoading(false);
      }
    };

    fetchContextData();
  }, [
    selectedTool,
    plotHoleContextType,
    isActive,
    project.id,
    activeToolDefinition?.name,
    allSceneTags,
    manuscriptChapters,
    outlineData,
    charactersForChat,
    worldNotes,
  ]);

  const handleSendMessageWrapper = async (userText: string) => {
    if (!selectedTool || !activeToolDefinition) {
      toast.error("No AI tool selected.");
      return;
    }

    let contextForAI: object | null = null;
    let toolNameToUseInAIService = selectedTool;

    switch (selectedTool) {
      case AI_TOOL_NAMES.MANUSCRIPT_CHAT:
        if (!manuscriptChapters) {
          toast.error("Manuscript data not loaded.");
          return;
        }
        contextForAI = { chapters: manuscriptChapters };
        break;
      case AI_TOOL_NAMES.OUTLINE_CHAT:
        if (!outlineData) {
          toast.error("Outline data not loaded.");
          return;
        }
        contextForAI = outlineData;
        break;
      case AI_TOOL_NAMES.CHARACTER_CHAT:
        if (!selectedCharacterForChat) {
          toast.error("Please select a character.");
          return;
        }
        contextForAI = {
          character: selectedCharacterForChat,
          relatedScenes: [],
        };
        break;
      case AI_TOOL_NAMES.WORLD_BUILDING_CHAT:
        if (!worldNotes) {
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
          if (!manuscriptChapters) {
            toast.error("Manuscript data not loaded for Plot Hole Checker.");
            return;
          }
          contextForAI = { chapters: manuscriptChapters };
          toolNameToUseInAIService = AI_TOOL_NAMES.PLOT_HOLE_CHECKER_MANUSCRIPT;
        } else {
          if (!outlineData) {
            toast.error("Outline data not loaded for Plot Hole Checker.");
            return;
          }
          contextForAI = outlineData;
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
      (plotHoleContextType === "manuscript" && !manuscriptChapters) ||
      (plotHoleContextType === "outline" && !outlineData)
    ) {
      toast.info("Context data is still loading. Please wait and try again.");
      return;
    }
    const plotHolePrompt = `Analyze the provided ${plotHoleContextType} for potential plot holes, inconsistencies, or unresolved questions. Provide a list of your findings.`;
    clearChat();
    await handleSendMessageWrapper(plotHolePrompt);
  };

  const handleCharacterSelectForChat = (character: ProjectCharacter) => {
    setSelectedCharacterForChat(character);
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

  const handleWorldNoteCreated = (newNote: WorldBuildingNote) => {
    setWorldNotes((prev) =>
      prev
        ? [...prev, newNote].sort((a, b) => a.title.localeCompare(b.title))
        : [newNote]
    );
    toast.success(`Note "${newNote.title}" created from chat!`);
    setIsCreateWorldNoteModalOpen(false);
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

          {isContextLoading &&
            selectedTool !== AI_TOOL_NAMES.WRITING_COACH &&
            selectedTool !== AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR && (
              <Paragraph>Loading context data...</Paragraph>
            )}

          {/* Manuscript Chat */}
          {selectedTool === AI_TOOL_NAMES.MANUSCRIPT_CHAT &&
            manuscriptChapters &&
            !isContextLoading && (
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
            outlineData &&
            !isContextLoading && (
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
            !isContextLoading && (
              <div className="flex flex-col flex-grow">
                {!selectedCharacterForChat &&
                  charactersForChat &&
                  charactersForChat.length > 0 && (
                    <div className="mb-4">
                      <Paragraph className="mb-2">
                        Select a character to chat with:
                      </Paragraph>
                      <div className="flex flex-wrap gap-2">
                        {charactersForChat.map((char) => (
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
                  charactersForChat &&
                  charactersForChat.length === 0 && (
                    <Paragraph>
                      No characters found. Create characters in the Characters
                      section.
                    </Paragraph>
                  )}
                {!selectedCharacterForChat && !charactersForChat && (
                  <Paragraph>Loading characters...</Paragraph>
                )}
                {selectedCharacterForChat && (
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
            worldNotes &&
            !isContextLoading && (
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
                  disabled={
                    !plotHoleContextType || isContextLoading || isChatLoading
                  }
                >
                  {isChatLoading ? "Analyzing..." : "Check for Plot Holes"}
                </Button>
              </div>
              {plotHoleContextType &&
                !isContextLoading &&
                (manuscriptChapters || outlineData) && (
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

  if (!isActive) {
    return null;
  }

  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumn}
        mainDetailColumn={mainDetailColumn}
      />
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
