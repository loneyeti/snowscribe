// components/dashboard/sections/WorldNotesSection/index.tsx
import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { useWorldNotesData } from "@/hooks/dashboard/useWorldNotesData";
import { WorldNoteList } from "@/components/world-notes/WorldNoteList";
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";
import { WorldNoteEditor } from "@/components/world-notes/WorldNoteEditor";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
import { PlusCircle } from "lucide-react";
import { Paragraph } from "@/components/typography/Paragraph";

interface WorldNotesSectionProps {
  project: Project;
  isActive: boolean;
}

export function WorldNotesSection({
  project,
  isActive,
}: WorldNotesSectionProps) {
  const {
    worldNotes,
    selectedWorldNote,
    isLoadingWorldNotesData,
    worldNotesFetchAttempted, // Consume the flag
    fetchProjectWorldNotes,
    handleWorldNoteSelect,
    handleSaveWorldNoteEditorData,
    handleWorldNoteDeleted,
    handleWorldNoteCreated,
    setSelectedWorldNote,
  } = useWorldNotesData(project.id); // project.id as dependency for the hook instance

  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  useEffect(() => {
    if (isActive) {
      // Condition updated to include worldNotesFetchAttempted
      // Fetch only if the section is active, not currently loading, and fetch hasn't been attempted yet for this project.
      if (!isLoadingWorldNotesData && !worldNotesFetchAttempted) {
        fetchProjectWorldNotes();
      }
    } else {
      setSelectedWorldNote(null); // Clear selection when section becomes inactive
    }
  }, [
    isActive,
    isLoadingWorldNotesData,
    worldNotesFetchAttempted, // Add new flag to dependency array
    fetchProjectWorldNotes, // This callback depends on projectId, stable if projectId is stable
    setSelectedWorldNote, // Setter, stable
  ]);

  if (!isActive) return null;

  const handleOpenCreateWorldNoteModal = () => {
    setIsCreateWorldNoteModalOpen(true);
  };

  const middleColumn = (
    <>
      <ContextualHeader
        title="World Notes"
        navControls={
          <IconButton
            icon={PlusCircle}
            aria-label="New World Note"
            onClick={handleOpenCreateWorldNoteModal}
          />
        }
      />
      <WorldNoteList
        notes={worldNotes}
        selectedNoteId={selectedWorldNote?.id}
        onSelectNote={handleWorldNoteSelect}
        onCreateNewNote={handleOpenCreateWorldNoteModal}
        // Show loading only if a fetch hasn't been attempted yet AND it's currently loading
        isLoading={isLoadingWorldNotesData && !worldNotesFetchAttempted}
      />
    </>
  );

  const mainDetailColumn = (
    <>
      {selectedWorldNote ? (
        <WorldNoteEditor
          key={selectedWorldNote.id} // Key ensures component re-mounts with new note data
          projectId={project.id}
          note={selectedWorldNote}
          onSave={handleSaveWorldNoteEditorData}
          onDelete={() => handleWorldNoteDeleted(selectedWorldNote.id)}
        />
      ) : isLoadingWorldNotesData && !worldNotesFetchAttempted ? (
        // If loading for the first time (fetch not attempted), show loading in detail too
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            Loading notes...
          </Paragraph>
        </div>
      ) : (
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            Select a world note to view details, or create a new one.
          </Paragraph>
        </div>
      )}
    </>
  );

  return (
    <>
      <SecondaryViewLayout
        middleColumn={middleColumn}
        mainDetailColumn={mainDetailColumn}
      />
      {isCreateWorldNoteModalOpen && (
        <CreateWorldNoteModal
          projectId={project.id}
          isOpen={isCreateWorldNoteModalOpen}
          onClose={() => setIsCreateWorldNoteModalOpen(false)}
          onNoteCreated={(newNote) => {
            handleWorldNoteCreated(newNote);
            setIsCreateWorldNoteModalOpen(false);
          }}
        />
      )}
    </>
  );
}
