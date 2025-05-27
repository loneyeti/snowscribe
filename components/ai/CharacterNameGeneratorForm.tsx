"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useAIChat } from "@/hooks/ai/useAIChat";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import { Paragraph } from "@/components/typography/Paragraph";
import { ScrollArea } from "@/components/ui/ScrollArea";
import MarkdownComponent from "./MarkdownComponent";
import { toast } from "sonner";

interface CharacterNameGeneratorFormProps {
  projectId: string;
}

export function CharacterNameGeneratorForm({
  projectId,
}: CharacterNameGeneratorFormProps) {
  const [criteria, setCriteria] = useState("");
  const { uiMessages, isLoading, error, sendUserMessage, clearChat } =
    useAIChat(projectId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!criteria.trim()) {
      toast.error("Please enter some criteria for name generation.");
      return;
    }
    clearChat();
    const userPromptForAI = `Generate a list of character names based on the following criteria: ${criteria}. Provide a diverse list of names. Format the output as a list.`;
    await sendUserMessage(
      userPromptForAI,
      AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR,
      { criteria }
    );
  };

  const aiResponses = uiMessages.filter((msg) => msg.sender === "ai");

  return (
    <div className="space-y-4 flex flex-col h-full">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={criteria}
          onChange={(e) => setCriteria(e.target.value)}
          placeholder="Enter criteria for character names (e.g., 'female, medieval fantasy, warrior princess, strong and elegant')..."
          rows={4}
          className="bg-background"
        />
        <Button type="submit" disabled={isLoading || !criteria.trim()}>
          {isLoading ? "Generating..." : "Generate Names"}
        </Button>
      </form>

      {error && <Paragraph className="text-destructive">{error}</Paragraph>}

      {aiResponses.length > 0 && (
        <div className="mt-4 space-y-2 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold">Suggested Names:</h3>
          <ScrollArea className="flex-grow p-3 bg-muted rounded-md border">
            {aiResponses.map((msg) => (
              <div key={msg.id} className="prose dark:prose-invert max-w-none">
                <MarkdownComponent markdown={msg.text} />
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
      {isLoading && !aiResponses.length && (
        <Paragraph>Generating names...</Paragraph>
      )}
    </div>
  );
}
