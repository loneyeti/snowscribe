"use client";
import React, { useState, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { useAIChat } from "@/hooks/ai/useAIChat";
import { Button } from "@/components/ui/Button";
import { Paragraph } from "@/components/typography/Paragraph";
import { MultiTurnChatInterface } from "@/components/ai/MultiTurnChatInterface";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import { toast } from "sonner";
import type { Character, Scene } from "@/lib/types";

export function CharacterChat() {
  const { project, chapters, characters, isStoreLoading } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      chapters: state.chapters,
      characters: state.characters,
      isStoreLoading: state.isLoading,
    }))
  );

  const projectId = project?.id || "placeholder-project-id";
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [charScenes, setCharScenes] = useState<Scene[] | null>(null);
  const [isContextLoading, setIsContextLoading] = useState(false);

  const {
    uiMessages,
    isLoading: isChatLoading,
    error: chatError,
    sendUserMessage,
    clearChat,
    setUiMessages,
  } = useAIChat(projectId);

  // Effect to find all scenes a selected character is in
  useEffect(() => {
    if (!selectedChar) {
      setCharScenes(null);
      return;
    }

    setIsContextLoading(true);
    const scenesForChar: Scene[] = [];
    chapters.forEach((chapter) => {
      chapter.scenes?.forEach((scene) => {
        const isPov = scene.pov_character_id === selectedChar.id;
        const isOther = scene.scene_characters?.some(
          (char) => char.character_id === selectedChar.id
        );
        if (isPov || isOther) {
          scenesForChar.push(scene);
        }
      });
    });
    setCharScenes(scenesForChar);
    setIsContextLoading(false);
  }, [selectedChar, chapters]);

  const handleCharacterSelect = (character: Character) => {
    setSelectedChar(character);
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

  const handleSendMessage = async (userText: string) => {
    if (!selectedChar) {
      toast.error("No character selected.");
      return;
    }
    if (charScenes === null) {
      toast.info(
        `Scene context for ${selectedChar.name} is preparing. Please wait.`
      );
      return;
    }

    const contextForAI = {
      character: selectedChar,
      relatedScenes: charScenes,
    };

    await sendUserMessage(userText, AI_TOOL_NAMES.CHARACTER_CHAT, contextForAI);
  };

  if (isStoreLoading.characters) {
    return <Paragraph>Loading characters...</Paragraph>;
  }

  if (!characters || characters.length === 0) {
    return (
      <Paragraph>
        No characters found. Please create a character in the
        &quot;Characters&quot; section first.
      </Paragraph>
    );
  }

  // Character Selection UI
  if (!selectedChar) {
    return (
      <div className="space-y-4">
        <Paragraph className="text-lg">
          Select a character to chat with:
        </Paragraph>
        <div className="flex flex-wrap gap-2">
          {characters.map((char) => (
            <Button
              key={char.id}
              variant="outline"
              onClick={() => handleCharacterSelect(char)}
            >
              {char.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Chat Interface UI
  return (
    <div className="flex flex-col h-full">
      {isContextLoading && (
        <Paragraph className="text-center p-4 animate-pulse">
          Loading all scene context for {selectedChar.name}...
        </Paragraph>
      )}
      {!isContextLoading && (
        <MultiTurnChatInterface
          uiMessages={uiMessages}
          isLoading={isChatLoading}
          error={chatError}
          onSendMessage={handleSendMessage}
          className="flex-grow"
          headerContent={
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Chatting with{" "}
                <span className="text-primary">{selectedChar.name}</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedChar(null)}
              >
                Change Character
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}
