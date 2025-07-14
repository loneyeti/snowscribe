import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { WorldNoteList } from "@/components/world-notes/WorldNoteList";
import { CreateWorldNoteModal } from "@/components/world-notes/CreateWorldNoteModal";
import { WorldNoteEditor, WorldNoteViewer } from "@/components/world-notes";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
import { PlusCircle } from "lucide-react";
import { Paragraph } from "@/components/typography/Paragraph";

export function WorldNotesSection() {
  const {
    project,
    worldNotes,
    selectedWorldNote,
    isEditingSelectedWorldNote,
    isLoading,
  } = useProjectStore(
    useShallow((state) => ({
      project: state.project,
      worldNotes: state.worldNotes,
      selectedWorldNote: state.selectedWorldNote,
      isEditingSelectedWorldNote: state.isEditingSelectedWorldNote,
      isLoading: state.isLoading,
    }))
  );

  const selectWorldNote = useProjectStore((state) => state.selectWorldNote);
  const enableWorldNoteEditMode = useProjectStore(
    (state) => state.enableWorldNoteEditMode
  );
  const disableWorldNoteEditMode = useProjectStore(
    (state) => state.disableWorldNoteEditMode
  );
  const updateWorldNote = useProjectStore((state) => state.updateWorldNote);
  const deleteWorldNote = useProjectStore((state) => state.deleteWorldNote);
  const [isCreateWorldNoteModalOpen, setIsCreateWorldNoteModalOpen] =
    useState(false);

  const handleOpenCreateWorldNoteModal = () => {
    setIsCreateWorldNoteModalOpen(true);
  };

  if (!project) {
    return <div>Loading project...</div>;
  }

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
        onSelectNote={selectWorldNote}
        onCreateNewNote={handleOpenCreateWorldNoteModal}
        isLoading={isLoading.worldNotes && worldNotes.length === 0}
      />
    </>
  );

  const mainDetailColumn = (
    <>
      {selectedWorldNote ? (
        isEditingSelectedWorldNote ? (
          <WorldNoteEditor
            key={`${selectedWorldNote.id}-editor`}
            projectId={project.id}
            note={selectedWorldNote}
            onSave={async (updatedNoteData) => {
              // Ensure category and content are either string or undefined (not null)
              const dataToSave = {
                ...updatedNoteData,
                category: updatedNoteData.category ?? undefined,
                content: updatedNoteData.content ?? undefined,
              };
              await updateWorldNote(selectedWorldNote.id, dataToSave);
              // The store will handle updating state, but we still need to exit edit mode.
              disableWorldNoteEditMode();
            }}
            onDelete={() => deleteWorldNote(selectedWorldNote.id)}
            onCancelEdit={disableWorldNoteEditMode}
            isSaving={isLoading.saving}
          />
        ) : (
          <WorldNoteViewer
            key={`${selectedWorldNote.id}-viewer`}
            note={selectedWorldNote}
            onEditClick={enableWorldNoteEditMode}
          />
        )
      ) : isLoading.worldNotes ? (
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
          //projectId={project.id}
          isOpen={isCreateWorldNoteModalOpen}
          onClose={() => setIsCreateWorldNoteModalOpen(false)}
          /*
          onNoteCreated={() => {
            // Store handles adding the note and selecting it.
            // Just close the modal.
            setIsCreateWorldNoteModalOpen(false);
          }} */
        />
      )}
    </>
  );
}
