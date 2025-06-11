"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatInterface } from "./AIChatInterface";
import { AIToolButton } from "./AIToolButton";
import { getToolModelByName } from "@/lib/data/toolModels";
import { getSystemPromptByCategory } from "@/lib/data/aiPrompts";
import MarkdownComponent from "./MarkdownComponent";

import type { ChatResponse, TextBlock } from "snowgander";

// This should match the ToolModel type from the database schema
interface AI_Vendor {
  id: string;
  name: string;
}

interface AI_Model {
  id: string;
  name: string;
  vendor_id: string;
  ai_vendors: AI_Vendor;
}

interface ToolModelResponse {
  id: string;
  name: string;
  model_id: string;
  created_at: string;
  updated_at: string;
  prompt?: string | null;
  system_prompt?: string | null;
  ai_models: AI_Model;
}

type AIComponentType = "chat" | "tool";

interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
  componentType?: AIComponentType;
  toolName?: string; // Name of the tool to look up in toolModels
  defaultPrompt?: string; // Default prompt if tool model doesn't provide one
  defaultSystemPrompt?: string; // Default system prompt if tool model doesn't provide one
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
    console.log(
      `[AISidePanel] fetchSystemPrompt called with category: ${category}`
    );
    try {
      console.log(
        `[AISidePanel] Calling getSystemPromptByCategory with category: ${category}`
      );
      const promptText = await getSystemPromptByCategory(category);
      console.log(
        `[AISidePanel] getSystemPromptByCategory returned for ${category}:`,
        {
          hasPrompt: !!promptText,
          promptLength: promptText?.length || 0,
          defaultSystemPromptLength: defaultSystemPrompt?.length || 0,
        }
      );

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
      console.log("loadToolModelAndPrompt called with toolName:", toolName);
      if (!toolName) {
        console.log("No toolName provided, setting toolModel to null");
        setToolModel(null);
        return;
      }

      setIsLoading(true);
      try {
        console.log(`Fetching tool model for tool: ${toolName}`);
        const response = await getToolModelByName(toolName);

        // Handle both array and single object responses
        const models = Array.isArray(response) ? response : [response];
        console.log("Processed models:", models);

        // Get the first model from the response array
        const model = models[0];

        if (!model) {
          throw new Error(`No model found for tool: ${toolName}`);
        }

        console.log("Using model:", model);

        // Get the model ID - try ai_models.id first, then model_id, then fallback to id
        const modelId = model.model_id;

        if (!modelId) {
          console.warn("No model ID found in the response:", model);
          throw new Error("No valid model ID found in the response");
        }

        console.log("Model ID:", modelId);

        // Fetch the system prompt for this tool's category (toolName)
        const systemPrompt = await fetchSystemPrompt(toolName);

        const newToolModel = {
          id: modelId,
          prompt: model.prompt || defaultPrompt,
          systemPrompt: systemPrompt,
        };

        console.log("Setting toolModel state:", newToolModel);
        setToolModel(newToolModel);
      } catch (error) {
        console.error("Error loading tool model or system prompt:", error);
        const fallbackModel = {
          id: "default",
          prompt: defaultPrompt,
          systemPrompt: defaultSystemPrompt,
        };
        console.log("Using fallback model:", fallbackModel);
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
                        toolName={title}
                        prompt={toolModel.prompt}
                        systemPrompt={toolModel.systemPrompt}
                        modelId={toolModel.id}
                        onResponse={(response: ChatResponse) => {
                          // Store the full ChatResponse
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
