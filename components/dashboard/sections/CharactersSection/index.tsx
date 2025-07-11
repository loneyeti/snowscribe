// components/dashboard/sections/CharactersSection/index.tsx
import React, { useState, useEffect, useRef } from "react";
import type { Project } from "@/lib/types";
import { useCharactersData } from "@/hooks/dashboard/useCharactersData";
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
  const {
    characters,
    selectedCharacter,
    isLoadingCharactersData,
    fetchProjectCharacters,
    handleCharacterSelect,
    handleSaveCharacterEditorData,
    handleCharacterDeleted,
    handleCharacterCreated,
  } = useCharactersData(project.id);

  const [isCreateCharacterModalOpen, setIsCreateCharacterModalOpen] =
    useState(false);
  const hasInitialFetchCompleted = useRef(false);

  useEffect(() => {
    if (
      characters.length === 0 &&
      !isLoadingCharactersData &&
      !hasInitialFetchCompleted.current
    ) {
      hasInitialFetchCompleted.current = true;
      fetchProjectCharacters();
    }
  }, [fetchProjectCharacters, characters.length, isLoadingCharactersData]);

  useEffect(() => {
    hasInitialFetchCompleted.current = false;
  }, [project.id]);

  const handleOpenCreateCharacterModal = () => {
    setIsCreateCharacterModalOpen(true);
  };

  const middleColumn = (
    <>
      <ContextualHeader
        title="Characters"
        navControls={
          <IconButton
            icon={PlusCircle}
            aria-label="New Character"
            onClick={handleOpenCreateCharacterModal}
          />
        }
      />
      <CharacterList
        characters={characters}
        selectedCharacterId={selectedCharacter?.id}
        onSelectCharacter={handleCharacterSelect}
        onCreateNewCharacter={handleOpenCreateCharacterModal}
        isLoading={isLoadingCharactersData && characters.length === 0} // Show loading only if list is empty and loading
      />
    </>
  );

  const mainDetailColumn = (
    <>
      {selectedCharacter ? (
        <CharacterCardEditor
          key={selectedCharacter.id} // Important for re-rendering when selectedCharacter changes
          initialData={{
            id: selectedCharacter.id,
            name: selectedCharacter.name,
            description: selectedCharacter.description || "",
            notes: selectedCharacter.notes || "",
            image_url: selectedCharacter.image_url ?? "",
          }}
          onSave={async (data) => {
            await handleSaveCharacterEditorData(data);
          }}
          onDelete={async () => {
            await handleCharacterDeleted(selectedCharacter.id);
          }}
        />
      ) : isLoadingCharactersData && !selectedCharacter ? ( // Show loading specifically for detail pane if loading a character
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
          projectId={project.id}
          isOpen={isCreateCharacterModalOpen}
          onClose={() => setIsCreateCharacterModalOpen(false)}
          onCharacterCreated={(newCharacter) => {
            handleCharacterCreated(newCharacter);
            setIsCreateCharacterModalOpen(false);
          }}
        />
      )}
    </>
  );
}
