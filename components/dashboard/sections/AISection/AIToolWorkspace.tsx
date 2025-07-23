"use client";

import React from "react";
import { Paragraph } from "@/components/typography/Paragraph";
import {
  AIToolDefinition,
  AIToolName,
  AI_TOOL_NAMES,
} from "@/lib/ai/constants";

// Import all specialized tool components
import { PlotHoleChecker } from "@/components/ai/PlotHoleChecker";
import { CharacterChat } from "@/components/ai/CharacterChat";
import { WorldBuildingChat } from "@/components/ai/WorldBuildingChat";
import { CharacterNameGeneratorForm } from "@/components/ai/CharacterNameGeneratorForm";
import { GenericToolChat } from "@/components/ai/GenericToolChat";

interface AIToolWorkspaceProps {
  activeToolDefinition: AIToolDefinition | null;
  selectedTool: AIToolName | null;
  projectId: string;
}

export function AIToolWorkspace({
  activeToolDefinition,
  selectedTool,
  projectId,
}: AIToolWorkspaceProps) {
  // Case 1: No tool is selected yet.
  if (!activeToolDefinition || !selectedTool) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <Paragraph className="text-muted-foreground text-lg">
          Select an AI tool from the list to get started.
        </Paragraph>
      </div>
    );
  }

  // Case 2: A tool is selected. Render the tool's header and the correct component.
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">{activeToolDefinition.name}</h2>
        <Paragraph className="text-muted-foreground">
          {activeToolDefinition.description}
        </Paragraph>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        {(() => {
          switch (selectedTool) {
            case AI_TOOL_NAMES.PLOT_HOLE_CHECKER:
              return <PlotHoleChecker projectId={projectId} />;

            case AI_TOOL_NAMES.CHARACTER_NAME_GENERATOR:
              return <CharacterNameGeneratorForm projectId={projectId} />;

            case AI_TOOL_NAMES.CHARACTER_CHAT:
              return <CharacterChat />;

            case AI_TOOL_NAMES.WORLD_BUILDING_CHAT:
              return <WorldBuildingChat />;

            // These three tools are now handled by the GenericToolChat component
            case AI_TOOL_NAMES.MANUSCRIPT_CHAT:
            case AI_TOOL_NAMES.OUTLINE_CHAT:
            case AI_TOOL_NAMES.WRITING_COACH:
              return (
                <GenericToolChat
                  tool={activeToolDefinition}
                  projectId={projectId}
                />
              );

            default:
              return (
                <Paragraph>This tool has not been configured yet.</Paragraph>
              );
          }
        })()}
      </div>
    </div>
  );
}
