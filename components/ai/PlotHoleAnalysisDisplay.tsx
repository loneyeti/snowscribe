"use client";

import React from "react";
import type { AIMessage } from "@/lib/types/ai";
import MarkdownComponent from "@/components/ai/MarkdownComponent";
import { Paragraph } from "@/components/typography/Paragraph";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface PlotHoleAnalysisDisplayProps {
  analysisMessages: AIMessage[];
}

export function PlotHoleAnalysisDisplay({
  analysisMessages,
}: PlotHoleAnalysisDisplayProps) {
  if (!analysisMessages || analysisMessages.length === 0) {
    return (
      <Paragraph className="text-muted-foreground italic">
        No analysis results to display yet.
      </Paragraph>
    );
  }

  return (
    <ScrollArea className="h-full p-1">
      <div className="space-y-4">
        {analysisMessages.map((msg) => (
          <div
            key={msg.id}
            className="p-4 border rounded-md bg-card prose dark:prose-invert max-w-none"
          >
            <MarkdownComponent markdown={msg.text} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
