"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { chat } from "@/lib/data/chat";

// Import types from snowgander
import type { ChatResponse } from "snowgander";

// Local type for AIToolButton props
interface AIToolButtonProps {
  toolName: string;
  prompt: string;
  systemPrompt: string;
  modelId: string;
  onResponse: (response: ChatResponse) => void;
  className?: string;
}

export function AIToolButton({
  toolName,
  prompt,
  systemPrompt,
  modelId,
  onResponse,
  className = "",
}: AIToolButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the chat function with the predefined prompt
      const response = await chat(modelId, [], prompt, systemPrompt);

      // Ensure we have a valid ChatResponse object
      if (
        !response ||
        typeof response !== "object" ||
        !("content" in response)
      ) {
        // If we don't have a valid ChatResponse, create an error response
        const errorResponse: ChatResponse = {
          role: "assistant",
          content: [
            {
              type: "error",
              publicMessage: "Invalid response format from AI service",
              privateMessage: `Unexpected response format: ${JSON.stringify(
                response
              )}`,
            },
          ],
        };
        onResponse(errorResponse);
        return;
      }

      // Pass the full ChatResponse object to the parent
      onResponse(response);
    } catch (err) {
      console.error("Error calling AI tool:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError("Failed to get response from AI. Please try again.");
      // Create a proper error response
      const errorResponse: ChatResponse = {
        role: "assistant",
        content: [
          {
            type: "error",
            publicMessage: "Failed to get response from AI. Please try again.",
            privateMessage: `Error: ${errorMessage}`,
          },
        ],
      };
      onResponse(errorResponse);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        disabled={isLoading}
        variant="outline"
        className="w-full justify-start"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          toolName
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
