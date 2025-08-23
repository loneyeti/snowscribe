"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatInterface } from "./AIChatInterface";
import { AIToolButton } from "./AIToolButton";
import { getToolModelByName } from "@/lib/data/toolModels";
import { getSystemPromptByCategory } from "@/lib/data/aiPrompts";
import MarkdownComponent from "./MarkdownComponent";

import type { ChatResponse } from "snowgander";

type AIComponentType = "chat" | "tool";

interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  componentType?: AIComponentType;
  toolName?: string;
  defaultPrompt?: string;
  defaultSystemPrompt?: string;
  projectId: string; // Add this line
  contextData?: unknown; // Add this line
}

export function AISidePanel({
  isOpen,
  onClose,
  children,
  title = "AI Assistant",
  componentType = "chat",
  toolName,
  defaultPrompt = "",
  defaultSystemPrompt = "You are a helpful AI assistant.",
  projectId, // Add this
  contextData, // Add this
}: AISidePanelProps) {
  const [aiResponse, setAiResponse] = useState<ChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toolModel, setToolModel] = useState<{
    id: string;
    prompt: string;
    systemPrompt: string;
  } | null>(null);

  // Function to fetch system prompt by category
  const fetchSystemPrompt = async (category: string) => {
    try {
      const promptText = await getSystemPromptByCategory(category);

      if (!promptText) {
        console.warn(
          `[AISidePanel] No prompt found for category: ${category}, using default`
        );
      }

      return promptText || defaultSystemPrompt;
    } catch (error) {
      console.error("[AISidePanel] Error in fetchSystemPrompt:", error);
      console.warn(`[AISidePanel] Using default system prompt due to error`);
      return defaultSystemPrompt;
    }
  };

  // Load tool model and system prompt when toolName changes
  useEffect(() => {
    const loadToolModelAndPrompt = async () => {
      if (!toolName) {
        setToolModel(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getToolModelByName(toolName);

        // Handle both array and single object responses
        const models = Array.isArray(response) ? response : [response];

        // Get the first model from the response array
        const model = models[0];

        if (!model) {
          throw new Error(`No model found for tool: ${toolName}`);
        }

        // Get the model ID - try ai_models.id first, then model_id, then fallback to id
        const modelId = model.model_id;

        if (!modelId) {
          console.warn("No model ID found in the response:", model);
          throw new Error("No valid model ID found in the response");
        }

        // Fetch the system prompt for this tool's category (toolName)
        const systemPrompt = await fetchSystemPrompt(toolName);

        const newToolModel = {
          id: modelId,
          prompt: model.prompt || defaultPrompt,
          systemPrompt: systemPrompt,
        };

        setToolModel(newToolModel);
      } catch (error) {
        console.error("Error loading tool model or system prompt:", error);
        const fallbackModel = {
          id: "default",
          prompt: defaultPrompt,
          systemPrompt: defaultSystemPrompt,
        };
        setToolModel(fallbackModel);
      } finally {
        setIsLoading(false);
      }
    };

    loadToolModelAndPrompt();
  }, [toolName, defaultPrompt, defaultSystemPrompt]);
  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-full max-w-2xl bg-background shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-57px)] overflow-y-auto p-4">
          {children || (
            <div className="h-full">
              {componentType === "tool" && toolName ? (
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                  ) : toolModel ? (
                    <>
                      <AIToolButton
                        toolName={toolName!} // Pass the toolName prop
                        prompt={defaultPrompt}
                        projectId={projectId}
                        contextData={contextData}
                        onResponse={(response: ChatResponse) => {
                          setAiResponse(response);
                        }}
                      />
                      {aiResponse?.content && aiResponse.content.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {aiResponse.content.map((block, index) => {
                            if (block.type === "text" && "text" in block) {
                              return (
                                <div
                                  key={`markdown-${index}`}
                                  className="prose dark:prose-invert w-full mx-auto align-left object-left content-left items-left text-left"
                                >
                                  <MarkdownComponent
                                    key={index}
                                    markdown={block.text}
                                  />
                                </div>
                              );
                            } else if (
                              block.type === "error" &&
                              "publicMessage" in block
                            ) {
                              return (
                                <div
                                  key={index}
                                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                                >
                                  <p className="text-red-600 dark:text-red-400">
                                    {block.publicMessage}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>No AI tool configuration found for {toolName}</div>
                  )}
                </div>
              ) : (
                <AIChatInterface onSubmitPrompt={() => {}} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
