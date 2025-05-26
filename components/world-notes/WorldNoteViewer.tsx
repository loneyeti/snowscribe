"use client";

import React from "react";
import { type WorldBuildingNote } from "@/lib/types";
import { Heading } from "@/components/typography/Heading";
import { Paragraph } from "@/components/typography/Paragraph";
import { Button } from "@/components/ui/Button";
import MarkdownComponent from "@/components/ai/MarkdownComponent";
import { Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/ScrollArea";

interface WorldNoteViewerProps {
  note: WorldBuildingNote;
  onEditClick: () => void;
}

export function WorldNoteViewer({ note, onEditClick }: WorldNoteViewerProps) {
  return (
    <div className="p-6 bg-card h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Heading level={3} className="border-none pb-0">
          {note.title}
        </Heading>
        <Button variant="outline" size="sm" onClick={onEditClick}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit Note
        </Button>
      </div>

      {note.category && (
        <Paragraph variant="muted" className="mb-4 text-sm italic">
          Category: {note.category}
        </Paragraph>
      )}

      <ScrollArea className="flex-grow prose dark:prose-invert max-w-none">
        {note.content ? (
          <MarkdownComponent markdown={note.content} />
        ) : (
          <Paragraph className="text-muted-foreground italic">
            This note has no content. Click Edit Note to add some.
          </Paragraph>
        )}
      </ScrollArea>
    </div>
  );
}
