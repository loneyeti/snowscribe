"use client";

import React, { useState, useRef, useEffect } from "react";
import type { AIMessage } from "@/lib/types/ai";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import MarkdownComponent from "./MarkdownComponent";

export interface CustomAction {
  label: string;
  onAction: (currentMessages: AIMessage[]) => void;
  isVisible?: (currentMessages: AIMessage[]) => boolean;
  // icon?: React.ReactNode; // Optional icon for the button
  // variant?: string; // Optional button variant
}

interface MultiTurnChatInterfaceProps {
  uiMessages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (prompt: string) => Promise<void> | void;
  className?: string;
  customActions?: CustomAction[];
}

export function MultiTurnChatInterface({
  uiMessages,
  isLoading,
  error,
  onSendMessage,
  className,
  customActions,
}: MultiTurnChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [uiMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    await onSendMessage(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea
        ref={scrollRef}
        className="flex-grow p-4 space-y-4 overflow-y-auto"
      >
        {uiMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "p-3 rounded-md max-w-full",
              msg.sender === "user"
                ? "bg-blue-100 self-end"
                : "bg-gray-100 self-start"
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownComponent markdown={msg.text} />
            </div>
          </div>
        ))}
        {error && <div className="text-red-600">{error}</div>}
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 p-3 border-t border-gray-300 bg-white rounded-b-md"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          Send
        </Button>
      </form>

      {customActions && customActions.length > 0 && (
        <div className="p-3 border-t border-gray-300 flex items-center justify-end space-x-2 bg-gray-50 rounded-b-lg">
          {customActions.map((action, index) => {
            const visible = action.isVisible
              ? action.isVisible(uiMessages)
              : true;
            if (!visible) return null;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => action.onAction(uiMessages)}
                disabled={isLoading}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
