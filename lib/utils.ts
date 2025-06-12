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

// Helper function to extract JSON from a string or object that might be wrapped in markdown or have extra text
export function extractJsonFromString<T = unknown>(input: unknown): T | null {
  // Handle cases where input might be an object or already parsed JSON
  if (typeof input === 'object' && input !== null) {
    try {
      return input as T;
    } catch {
      // Fall through to string processing
    }
  }

  if (typeof input !== 'string' || !input.trim()) return null;

  let jsonString: string | null = null;

  // Attempt to find JSON within markdown code blocks (```json ... ``` or ``` ... ```)
  const markdownJsonMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownJsonMatch && markdownJsonMatch[1]) {
    jsonString = markdownJsonMatch[1].trim();
  }

  // Attempt to find JSON that might be just { ... } or [ ... ]
  // This is a bit more heuristic but common for AI responses
  if (!jsonString) {
    const bracesJsonMatch = input.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (bracesJsonMatch && bracesJsonMatch[0]) {
      jsonString = bracesJsonMatch[0].trim();
    }
  }

  // If no clear JSON structure is found, try parsing the whole string
  if (!jsonString) {
    jsonString = input.trim();
  }

  // Try to parse whatever we found
  try {
    if (jsonString) {
      return JSON.parse(jsonString) as T;
    }
    return null;
  } catch {
    return null;
  }
}
