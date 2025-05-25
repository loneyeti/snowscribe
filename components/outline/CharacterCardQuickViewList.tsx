"use client";

import React from "react";
import type { Character } from "@/lib/types";
import { Paragraph } from "@/components/typography/Paragraph"; // Use Paragraph for list items

interface CharacterCardQuickViewListProps {
  characters: Character[];
  // onCharacterSelect?: (characterId: string) => void; // Keep for future potential interaction
}

export function CharacterCardQuickViewList({
  characters,
}: CharacterCardQuickViewListProps) {
  if (!characters || characters.length === 0) {
    return (
      <Paragraph className="text-sm text-muted-foreground italic mt-0">
        {/* Ensure mt-0 if it's the first element after a heading */}
        No characters found. Add characters in the Characters section.
      </Paragraph>
    );
  }

  return (
    <div className="space-y-1">
      {" "}
      {/* Reduced space between items */}
      <ul className="list-none pl-0 space-y-1">
        {" "}
        {/* Removed list-disc, list-inside, adjusted spacing */}
        {characters.map((character) => (
          <li key={character.id}>
            <Paragraph variant="small" className="text-foreground mt-0">
              {" "}
              {/* Use Paragraph with small variant */}
              {character.name}
              {character.nickname && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({character.nickname})
                </span>
              )}
            </Paragraph>
          </li>
        ))}
      </ul>
    </div>
  );
}
