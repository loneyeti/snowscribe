"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { sendMessage } from "@/lib/ai/AISMessageHandler"; // Add this
import { toast } from "sonner"; // Add this

// Import types from snowgander
import type { ChatResponse } from "snowgander";

// Local type for AIToolButton props
interface AIToolButtonProps {
  toolName: string;
  prompt: string;
  onResponse: (response: ChatResponse) => void;
  projectId: string; // Add this
  contextData?: unknown; // Add this
  className?: string;
}

export function AIToolButton({
  toolName,
  prompt,
  onResponse,
  projectId,
  contextData,
  className = "",
}: AIToolButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call the centralized AI handler
      const response = await sendMessage(
        projectId,
        toolName,
        prompt,
        contextData
      );

      // Check for a specific error block in the response
      const errorBlock = response.content?.find(
        (block) => block.type === "error"
      ) as (import("snowgander").ErrorBlock & { code?: string }) | undefined;

      if (errorBlock) {
        // If the error is insufficient credits, show a toast and do nothing else.
        if (errorBlock.code === "INSUFFICIENT_CREDITS") {
          toast.error(
            errorBlock.publicMessage || "Insufficient credits for this action."
          );
        } else {
          // For other AI errors, display them in the component's error state.
          setError(errorBlock.publicMessage || "An unknown AI error occurred.");
        }
      }

      // Pass the full response to the parent component.
      onResponse(response);
    } catch (err) {
      console.error("Error calling AI tool:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError("Failed to get response from AI. Please try again.");
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
