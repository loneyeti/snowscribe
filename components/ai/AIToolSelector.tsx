"use client";

import React from "react";
import { ListContainer } from "@/components/ui/ListContainer";
import { AIToolListItem } from "./AIToolListItem";
import type { AIToolDefinition, AIToolName } from "@/lib/ai/constants";
import { ContextualHeader } from "@/components/ui/ContextualHeader";

interface AIToolSelectorProps {
  tools: readonly AIToolDefinition[];
  selectedToolId: AIToolName | null;
  onSelectTool: (toolId: AIToolName) => void;
}

export function AIToolSelector({
  tools,
  selectedToolId,
  onSelectTool,
}: AIToolSelectorProps) {
  return (
    <>
      <ContextualHeader title="AI Tools" />
      <ListContainer>
        {tools.map((tool) => (
          <AIToolListItem
            key={tool.id}
            tool={tool}
            isSelected={tool.id === selectedToolId}
            onSelect={onSelectTool}
          />
        ))}
      </ListContainer>
    </>
  );
}
