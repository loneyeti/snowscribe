// lib/types/ai.ts
import { ChatResponse as SnowganderChatResponse } from 'snowgander';

/**
 * Represents a message in the UI, whether from the user, AI, or system.
 */
export interface AIMessage {
  /** Unique identifier for the message (e.g., UUID). */
  id: string;
  /** The primary text content of the message, formatted for display.
   * For AI messages, this will be extracted from SnowganderChatResponse.
   */
  text: string;
  /** Indicates who sent the message. 'system' can be used for UI-generated messages like errors or status info. */
  sender: 'user' | 'ai' | 'system';
  /** Timestamp of when the message was created or received. */
  timestamp: Date;
  /** Optional: Helps UI in styling or interpreting content. Defaults to 'text'. */
  type?: 'text' | 'error' | 'info';
  /** Optional: Store the original Snowgander response for AI messages.
   * Useful for debugging or accessing rich content not directly mapped to `text`.
   */
  rawSnowganderResponse?: SnowganderChatResponse;
  /** Optional: For any UI-specific flags or additional data. */
  metadata?: Record<string, unknown>;
}
