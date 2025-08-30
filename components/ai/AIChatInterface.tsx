"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SendHorizonal } from "lucide-react";
import { TypingIndicator } from "../ui/TypingIndicator";
// Assuming Button and Input components will be available
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AIChatInterfaceProps {
  initialMessages?: Message[];
  onSubmitPrompt: (prompt: string) => void | Promise<void>;
  isLoading?: boolean; // To show a loading state while AI is responding
  className?: string;
}

export function AIChatInterface({
  initialMessages = [],
  onSubmitPrompt,
  isLoading = false,
  className,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // If initialMessages prop changes, update the state
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentPrompt(event.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!currentPrompt.trim() || isLoading) return;

      // Optionally, add user's message to local state immediately
      // Or wait for it to be echoed back via props if messages are managed externally
      // For this example, let's assume messages are primarily managed by parent via initialMessages
      // and onSubmitPrompt will trigger an update.

      await onSubmitPrompt(currentPrompt.trim());
      setCurrentPrompt(""); // Clear input after sending
    },
    [currentPrompt, onSubmitPrompt, isLoading]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full max-h-[70vh] bg-card border border-border rounded-lg shadow",
        className
      )}
    >
      {/* Message Display Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] p-3 rounded-lg shadow-sm",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs text-right opacity-70 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg shadow-sm bg-muted">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center p-3 border-t border-border bg-background rounded-b-lg"
      >
        <input // Replace with your Input component
          type="text"
          value={currentPrompt}
          onChange={handleInputChange}
          placeholder="Ask the AI something..."
          disabled={isLoading}
          className="flex-grow p-2 mr-2 rounded-md border border-input bg-transparent focus:ring-1 focus:ring-primary focus:outline-none sm:text-sm"
        />
        <button // Replace with your Button component (size="icon" or similar)
          type="submit"
          disabled={isLoading || !currentPrompt.trim()}
          className={cn(
            "p-2 rounded-md text-primary disabled:text-muted-foreground disabled:opacity-50 hover:bg-primary/10 focus:outline-none focus:ring-1 focus:ring-primary",
            isLoading ? "cursor-not-allowed" : "cursor-pointer"
          )}
          aria-label="Send prompt"
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
