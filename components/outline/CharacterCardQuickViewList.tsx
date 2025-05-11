"use client";

import React from "react";
import type { Character } from "@/lib/types";
// import { CharacterCard } from "@/components/characters/CharacterCard"; // Assuming a compact card component might exist or be created

interface CharacterCardQuickViewListProps {
  characters: Character[];
  // onCharacterSelect?: (characterId: string) => void; // Optional: if clicking a card should do something
}

export function CharacterCardQuickViewList({
  characters,
}: CharacterCardQuickViewListProps) {
  if (!characters || characters.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No characters found for this project. Add characters in the Characters
        section.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* 
        This will be a list or grid of character cards.
        Each card should be a compact, read-only summary.
        Example: Name, Image (if any), a very short description snippet.
      */}
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Character quick view list will be implemented here. Displaying{" "}
        {characters.length} character(s).
      </p>
      {/* Placeholder rendering */}
      {/* {characters.map((character) => (
        <div key={character.id} className="p-2 border rounded bg-slate-50 dark:bg-slate-700">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">{character.name}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{character.description || "No description"}</p>
        </div>
      ))} */}
    </div>
  );
}
