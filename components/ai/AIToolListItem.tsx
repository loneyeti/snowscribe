"use client";

import React from "react";
import { ListItem } from "@/components/ui/ListItem";
import type { AIToolDefinition, AIToolName } from "@/lib/ai/constants";

interface AIToolListItemProps {
  tool: AIToolDefinition;
  isSelected: boolean;
  onSelect: (toolId: AIToolName) => void;
}

export function AIToolListItem({
  tool,
  isSelected,
  onSelect,
}: AIToolListItemProps) {
  return (
    <ListItem
      title={tool.name}
      secondaryText={tool.description}
      onClick={() => onSelect(tool.id)}
      isSelected={isSelected}
      aria-current={isSelected ? "page" : undefined}
    />
  );
}
