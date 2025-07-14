import React, { useState } from "react";
import type { Project } from "@/lib/types";
import { useShallow } from "zustand/react/shallow";
import { useProjectStore } from "@/lib/stores/projectStore";
import { CharacterList } from "@/components/characters/CharacterList";
import { CharacterCardEditor } from "@/components/editors/CharacterCardEditor";
import { SecondaryViewLayout } from "@/components/layouts/SecondaryViewLayout";
import { ContextualHeader } from "@/components/ui/ContextualHeader";
import { IconButton } from "@/components/ui/IconButton";
import { PlusCircle } from "lucide-react";
import { CreateCharacterModal } from "@/components/characters/CreateCharacterModal";
import { Paragraph } from "@/components/typography/Paragraph";

interface CharactersSectionProps {
  project: Project;
}

export function CharactersSection({ project }: CharactersSectionProps) {
  const { characters, selectedCharacter, isLoading } = useProjectStore(
    useShallow((state) => ({
      characters: state.characters,
      selectedCharacter: state.selectedCharacter,
      isLoading: state.isLoading,
    }))
  );

  const selectCharacter = useProjectStore((state) => state.selectCharacter);
  const updateCharacter = useProjectStore((state) => state.updateCharacter);
  const deleteCharacter = useProjectStore((state) => state.deleteCharacter);

  const [isCreateCharacterModalOpen, setIsCreateCharacterModalOpen] =
    useState(false);

  const middleColumn = (
    <>
      <ContextualHeader
        title="Characters"
        navControls={
          <IconButton
            icon={PlusCircle}
            aria-label="New Character"
            onClick={() => setIsCreateCharacterModalOpen(true)}
          />
        }
      />
      <CharacterList
        characters={characters}
        selectedCharacterId={selectedCharacter?.id}
        onSelectCharacter={selectCharacter}
        onCreateNewCharacter={() => setIsCreateCharacterModalOpen(true)}
        isLoading={isLoading.characters && characters.length === 0}
      />
    </>
  );

  const mainDetailColumn = (
    <>
      {selectedCharacter ? (
        <CharacterCardEditor
          key={selectedCharacter.id}
          initialData={{
            id: selectedCharacter.id,
            name: selectedCharacter.name,
            description: selectedCharacter.description || "",
            notes: selectedCharacter.notes || "",
            image_url: selectedCharacter.image_url ?? "",
          }}
          onSave={async (data) => {
            await updateCharacter(selectedCharacter.id, data);
          }}
          onDelete={async () => {
            await deleteCharacter(selectedCharacter.id);
          }}
        />
      ) : isLoading.characters ? (
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            Loading character details...
          </Paragraph>
        </div>
      ) : (
        <div className="p-8 flex items-center justify-center h-full">
          <Paragraph className="text-muted-foreground">
            Select a character to view details, or create a new one.
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
      {isCreateCharacterModalOpen && (
        <CreateCharacterModal
          isOpen={isCreateCharacterModalOpen}
          onClose={() => setIsCreateCharacterModalOpen(false)}
        />
      )}
    </>
  );
}
