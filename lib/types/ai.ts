import { PrimarySceneCategory } from './index'; // Assuming PrimarySceneCategory is in index.ts

export interface ParsedCharacter {
  name: string;
  description?: string; // Brief, 1-2 sentences
}

export interface ParsedScene {
  title: string;
  order: number; // 0-indexed within the chapter
  description: string; // 1-3 sentences summarizing the scene
  povCharacterName?: string; // Name of the POV character for this scene
  otherCharacterNames?: string[]; // List of names of other characters present
  tagNames?: string[]; // List of descriptive tag names (e.g., "Action", "Mystery Introduction")
  primaryCategory?: PrimarySceneCategory; // Must be one of the valid ENUM values
}

export interface ParsedChapter {
  title: string;
  order: number; // 0-indexed overall chapter order
  scenes: ParsedScene[];
}

export interface ParsedOutlineData {
  characters: ParsedCharacter[];
  chapters: ParsedChapter[];
}
