"use client";

import React, { useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { AIToolSelector } from "@/components/ai/AIToolSelector";
import {
  AI_PAGE_TOOLS,
  AIToolName,
  AIToolDefinition,
} from "@/lib/ai/constants";
import { Paragraph } from "@/components/typography/Paragraph";
import { AIToolWorkspace } from "./AIToolWorkspace";

export function AISection() {
  const { project } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
    }))
  );

  const [selectedTool, setSelectedTool] = useState<AIToolName | null>(null);
  const [activeToolDefinition, setActiveToolDefinition] =
    useState<AIToolDefinition | null>(null);

  const handleToolSelect = useCallback((toolId: AIToolName) => {
    setSelectedTool(toolId);
    const toolDef = AI_PAGE_TOOLS.find((t) => t.id === toolId) || null;
    setActiveToolDefinition(toolDef);
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <Paragraph>Loading project...</Paragraph>
      </div>
    );
  }

  const middleColumn = (
    <AIToolSelector
      tools={AI_PAGE_TOOLS}
      selectedToolId={selectedTool}
      onSelectTool={handleToolSelect}
    />
  );

  const mainDetailColumn = (
    <AIToolWorkspace
      activeToolDefinition={activeToolDefinition}
      selectedTool={selectedTool}
      projectId={project.id}
    />
  );

  return (
    <SecondaryViewLayout
      middleColumn={middleColumn}
      mainDetailColumn={mainDetailColumn}
    />
  );
}
