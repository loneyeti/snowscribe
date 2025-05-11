"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
// Assuming Button and Textarea components will be available
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";

interface NoteEditorProps {
  initialContent?: string;
  onSave: (content: string) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
}

export function NoteEditor({
  initialContent = "",
  onSave,
  onCancel,
  className,
  placeholder = "Start typing your note...",
}: NoteEditorProps) {
  const [content, setContent] = useState<string>(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(event.target.value);
    },
    []
  );

  const handleSave = useCallback(async () => {
    await onSave(content);
  }, [content, onSave]);

  // TODO: Implement Markdown support and a preview panel.
  // For now, it's a plain textarea.

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card p-4 rounded-lg shadow",
        className
      )}
    >
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex-grow w-full p-3 resize-none text-base leading-relaxed",
          "bg-input text-foreground placeholder-muted-foreground",
          "border border-border rounded-md focus:ring-primary focus:border-primary focus:outline-none",
          "min-h-[200px]" // Ensure a minimum height
        )}
      />
      <div className="flex justify-end space-x-3 mt-4">
        {onCancel && (
          <button // Replace with Button variant="outline"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted/50"
          >
            Cancel
          </button>
        )}
        <button // Replace with Button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Save Note
        </button>
      </div>
    </div>
  );
}
