import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function countWords(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  // Remove leading/trailing whitespace, then split by any sequence of whitespace characters.
  // Filter out empty strings that can result from multiple spaces if text is "  ".
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Helper function to extract JSON from a string that might be wrapped in markdown or have extra text
export function extractJsonFromString(str: string): string | null {
  if (!str) return null;

  // Attempt to find JSON within markdown code blocks (```json ... ``` or ``` ... ```)
  const markdownJsonMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    return markdownJsonMatch[1].trim();
  }

  // Attempt to find JSON that might be just { ... } or [ ... ]
  // This is a bit more heuristic but common for AI responses
  const bracesJsonMatch = str.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (bracesJsonMatch && bracesJsonMatch[0]) {
    // Test if this extracted string is parsable JSON
    try {
      JSON.parse(bracesJsonMatch[0]);
      return bracesJsonMatch[0].trim();
    } catch (e) {
      // It looked like JSON, but wasn't. Continue to next check.
    }
  }

  // If no clear JSON structure is found, return the trimmed original string
  // and let the JSON.parse attempt catch if it's not valid.
  // This handles cases where the AI *might* return valid JSON directly.
  return str.trim();
}