// lib/types/ai.ts

// Add this interface
export interface AIMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system'; // Adjust roles as needed for your chat logic
  timestamp: Date;
  type?: 'text' | 'error' | 'info' | 'loader'; // Optional: for UI styling or message categorization
  rawSnowganderResponse?: import('snowgander').ChatResponse; // Optional: useful for debugging or advanced display
}

// Existing exports (example placeholders, adjust as per actual content)
export interface ParsedCharacter {
  name: string;
  description?: string;
}

export interface ParsedScene {
  title: string;
  order: number;
  description?: string;
  povCharacterName?: string;
  otherCharacterNames?: string[];
  tagNames?: string[];
  primaryCategory?: 'Action' | 'Dialogue' | 'Reflection' | 'Discovery' | 'Relationship' | 'Transition' | 'Worldbuilding';
}

export interface ParsedChapter {
  title: string;
  order: number;
  scenes: ParsedScene[];
}

export interface ParsedOutlineData {
  characters: ParsedCharacter[];
  chapters: ParsedChapter[];
}
