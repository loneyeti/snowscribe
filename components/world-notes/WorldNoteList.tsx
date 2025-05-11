"use client";

import React from "react";
import { type WorldBuildingNote } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/ListItem";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListSectionHeader } from "@/components/ui/ListSectionHeader";
import { PlusCircle } from "lucide-react";

interface WorldNoteListProps {
  notes: WorldBuildingNote[];
  selectedNoteId?: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNewNote: () => void;
  isLoading?: boolean;
}

export function WorldNoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNewNote,
  isLoading,
}: WorldNoteListProps) {
  if (isLoading) {
    return (
      <ListContainer>
        <ListSectionHeader title="World Notes" />
        <div className="p-4 text-sm text-gray-500">Loading notes...</div>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      <ListSectionHeader
        title="World Notes"
        actionElement={
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNewNote}
            aria-label="Create new world note"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Note
          </Button>
        }
      />
      {!notes || notes.length === 0 ? (
        <div className="p-4 text-sm text-center text-gray-500">
          No world notes yet.
          <Button variant="link" onClick={onCreateNewNote} className="pl-1">
            Create one?
          </Button>
        </div>
      ) : (
        <ul>
          {notes.map((note) => (
            <ListItem
              key={note.id}
              title={note.title}
              secondaryText={note.category || undefined} // Display category as secondaryText if present
              onClick={() => onSelectNote(note.id)}
              isSelected={note.id === selectedNoteId}
              aria-current={note.id === selectedNoteId ? "page" : undefined}
            />
          ))}
        </ul>
      )}
    </ListContainer>
  );
}
