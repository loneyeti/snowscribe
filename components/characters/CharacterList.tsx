"use client";

import React from "react";
import { type Character } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/ListItem";
import { ListContainer } from "@/components/ui/ListContainer";
import { ListSectionHeader } from "@/components/ui/ListSectionHeader";
import { PlusCircle } from "lucide-react";

interface CharacterListProps {
  characters: Character[];
  selectedCharacterId?: string | null;
  onSelectCharacter: (characterId: string) => void;
  onCreateNewCharacter: () => void;
  isLoading?: boolean;
}

export function CharacterList({
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onCreateNewCharacter,
  isLoading,
}: CharacterListProps) {
  if (isLoading) {
    return (
      <ListContainer>
        <ListSectionHeader title="Characters" />
        <div className="p-4 text-sm text-gray-500">Loading characters...</div>
      </ListContainer>
    );
  }

  return (
    <ListContainer>
      <ListSectionHeader
        title="Characters"
        actionElement={
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateNewCharacter}
            aria-label="Create new character"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Character
          </Button>
        }
      />
      {characters.length === 0 ? (
        <div className="p-4 text-sm text-center text-gray-500">
          No characters yet.
          <Button
            variant="link"
            onClick={onCreateNewCharacter}
            className="pl-1"
          >
            Create one?
          </Button>
        </div>
      ) : (
        <ul>
          {characters.map((character) => (
            <ListItem
              key={character.id}
              title={character.name}
              // subtitle={character.description ? `${character.description.substring(0, 50)}...` : undefined}
              onClick={() => onSelectCharacter(character.id)}
              isSelected={character.id === selectedCharacterId}
              aria-current={
                character.id === selectedCharacterId ? "page" : undefined
              }
            />
          ))}
        </ul>
      )}
    </ListContainer>
  );
}
