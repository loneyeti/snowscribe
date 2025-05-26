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
    fetchProjectWorldNotes,
    handleWorldNoteSelect,
    handleSaveWorldNoteEditorData,
    handleWorldNoteDeleted,
    handleWorldNoteCreated,
    setSelectedWorldNote,
  } = useWorldNotesData(project.id);

  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  useEffect(() => {
    if (isActive) {
      if (worldNotes.length === 0 && !isLoadingWorldNotesData) {
        fetchProjectWorldNotes();
      }
    } else {
      setSelectedWorldNote(null);
    }
  }, [
    isActive,
    fetchProjectWorldNotes,
    worldNotes.length,
    isLoadingWorldNotesData,
    setSelectedWorldNote,
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
        isLoading={isLoadingWorldNotesData && worldNotes.length === 0}
      />
    </>
  );

  const mainDetailColumn = (
    <>
      {selectedWorldNote ? (
        <WorldNoteEditor
          key={selectedWorldNote.id}
          projectId={project.id}
          note={selectedWorldNote}
          onSave={handleSaveWorldNoteEditorData}
          onDelete={() => handleWorldNoteDeleted(selectedWorldNote.id)}
        />
      ) : isLoadingWorldNotesData && !selectedWorldNote ? (
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            Loading note details...
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
