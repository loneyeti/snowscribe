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
