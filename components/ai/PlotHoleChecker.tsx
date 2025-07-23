"use client";
import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { Button } from "@/components/ui/Button";
import { Paragraph } from "@/components/typography/Paragraph";
import { PlotHoleAnalysisDisplay } from "@/components/ai/PlotHoleAnalysisDisplay";
import { sendMessage as AISMessageHandler } from "@/lib/ai/AISMessageHandler";
import { AI_TOOL_NAMES } from "@/lib/ai/constants";
import { toast } from "sonner";
import type { AIMessage } from "@/lib/types";
import type { ChatResponse as SnowganderChatResponse } from "snowgander";

interface PlotHoleCheckerProps {
  projectId: string;
}

export function PlotHoleChecker({ projectId }: PlotHoleCheckerProps) {
  // Get required project data from the store
  const { chapters, characters, sceneTags, isStoreLoading } = useProjectStore(
    useShallow((state) => ({
      chapters: state.chapters,
      characters: state.characters,
      sceneTags: state.sceneTags,
      isStoreLoading: state.isLoading,
    }))
  );

  // State managed within this component
  const [contextType, setContextType] = useState<
    "manuscript" | "outline" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AIMessage[]>([]);

  const handleAnalyze = async () => {
    if (!contextType) {
      toast.error("Please select Manuscript or Outline to analyze.");
      return;
    }

    if (
      (contextType === "manuscript" && isStoreLoading.chapters) ||
      (contextType === "outline" &&
        (isStoreLoading.chapters ||
          isStoreLoading.characters ||
          isStoreLoading.sceneTags))
    ) {
      toast.info("Context data is still loading. Please wait and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults([]); // Clear previous results

    const toolNameToUse =
      contextType === "manuscript"
        ? AI_TOOL_NAMES.PLOT_HOLE_CHECKER_MANUSCRIPT
        : AI_TOOL_NAMES.PLOT_HOLE_CHECKER_OUTLINE;

    const contextForAI =
      contextType === "manuscript"
        ? { chapters }
        : { chapters, characters, sceneTags };

    const userPrompt = `Analyze the provided ${contextType} for potential plot holes, inconsistencies, or unresolved questions. Provide a detailed list of your findings, explaining each potential issue clearly.`;

    try {
      const response: SnowganderChatResponse = await AISMessageHandler(
        projectId,
        toolNameToUse,
        userPrompt,
        contextForAI
      );

      if (response.content && response.content[0]?.type === "text") {
        const newMessages: AIMessage[] = response.content.map(
          (block, index) => ({
            id: `${Date.now()}-${index}`,
            text: (block as { text: string }).text,
            sender: "ai",
            timestamp: new Date(),
          })
        );
        setAnalysisResults(newMessages);
      } else if (response.content && response.content[0]?.type === "error") {
        const errorMsg =
          (response.content[0] as { publicMessage?: string }).publicMessage ||
          "An unknown error occurred.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const fallbackError =
          "Received an unexpected response format from the AI.";
        setError(fallbackError);
        toast.error(fallbackError);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to perform analysis.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Paragraph>Analyze:</Paragraph>
        <Button
          variant={contextType === "manuscript" ? "default" : "outline"}
          onClick={() => setContextType("manuscript")}
          disabled={isLoading}
        >
          Manuscript
        </Button>
        <Button
          variant={contextType === "outline" ? "default" : "outline"}
          onClick={() => setContextType("outline")}
          disabled={isLoading}
        >
          Outline
        </Button>
        <Button onClick={handleAnalyze} disabled={!contextType || isLoading}>
          {isLoading ? "Analyzing..." : "Check for Plot Holes"}
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto border rounded-lg p-4 bg-muted/20">
        {isLoading && (
          <Paragraph className="text-muted-foreground animate-pulse">
            Analyzing your project... This may take a moment.
          </Paragraph>
        )}
        {error && <Paragraph className="text-destructive">{error}</Paragraph>}

        {!isLoading && analysisResults.length > 0 && (
          <PlotHoleAnalysisDisplay analysisMessages={analysisResults} />
        )}

        {!isLoading && !error && analysisResults.length === 0 && (
          <Paragraph className="text-muted-foreground text-center pt-8">
            Select &quot;Manuscript&quot; or &quot;Outline&quot; and click
            &quot;Check for Plot Holes&quot; to begin the analysis.
          </Paragraph>
        )}
      </div>
    </div>
  );
}
