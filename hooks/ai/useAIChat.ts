// hooks/ai/useAIChat.ts
"use client";

import { useState, useCallback } from 'react';
import { AIMessage } from '@/lib/types/ai';
import { sendMessage as callAIService } from '@/lib/ai/AISMessageHandler';
import { ChatResponse as SnowganderChatResponse, TextBlock, ErrorBlock } from 'snowgander';
import { v4 as uuidv4 } from 'uuid';

export interface UseAIChatReturn {
  uiMessages: AIMessage[];
  snowganderHistory: SnowganderChatResponse[];
  isLoading: boolean;
  error: string | null;
  sendUserMessage: (userText: string, toolName: string, contextData?: any) => Promise<void>;
  setUiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>;
  setSnowganderHistory: React.Dispatch<React.SetStateAction<SnowganderChatResponse[]>>;
  clearChat: () => void;
}

/**
 * Custom hook to manage state and logic for an AI chat session.
 * @param projectId - The ID of the project this chat belongs to.
 */
export function useAIChat(projectId: string): UseAIChatReturn {
  const [uiMessages, setUiMessages] = useState<AIMessage[]>([]);
  const [snowganderHistory, setSnowganderHistory] = useState<SnowganderChatResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendUserMessage = useCallback(async (userText: string, toolName: string, contextData?: unknown) => {
    setIsLoading(true);
    setError(null);

    const userUiMessage: AIMessage = {
      id: uuidv4(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };
    setUiMessages(prev => [...prev, userUiMessage]);

    // The user's message also needs to be part of the history sent to the AI
    // AISMessageHandler expects SnowganderChatResponse[] for history.
    // A simple way to represent user messages in that history:
    const userSnowganderMessage: SnowganderChatResponse = {
      role: 'user',
      content: [{ type: 'text', text: userText }],
      // model, usage, etc., are not applicable for user messages in history
    };
    
    // Pass the current history *plus* the new user message
    const historyForAIService = [...snowganderHistory, userSnowganderMessage];

    try {
      const aiSnowganderResponse = await callAIService(
        projectId,
        toolName,
        userText, // AISMessageHandler uses this as the immediate prompt, contextData for broader context
        contextData,
        historyForAIService
      );

      let aiResponseText = "AI response could not be processed.";
      let messageType: AIMessage['type'] = 'text';
      let publicErrorMsg: string | null = null;

      if (aiSnowganderResponse.content && aiSnowganderResponse.content.length > 0) {
        const firstBlock = aiSnowganderResponse.content[0];
        if (firstBlock.type === 'text' && 'text' in firstBlock) {
          aiResponseText = (firstBlock as TextBlock).text;
        } else if (firstBlock.type === 'error' && 'publicMessage' in firstBlock) {
          aiResponseText = (firstBlock as ErrorBlock).publicMessage;
          publicErrorMsg = aiResponseText;
          messageType = 'error';
        }
      } else if (aiSnowganderResponse.role === 'error') { 
         aiResponseText = "An error occurred with the AI service.";
         publicErrorMsg = aiResponseText;
         messageType = 'error';
      }
      
      if (publicErrorMsg) setError(publicErrorMsg);


      const aiUiMessage: AIMessage = {
        id: uuidv4(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        type: messageType,
        rawSnowganderResponse: aiSnowganderResponse,
      };
      setUiMessages(prev => [...prev, aiUiMessage]);

      // Update the canonical snowganderHistory with the user's message and the AI's response
      setSnowganderHistory([...historyForAIService, aiSnowganderResponse]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      console.error("useAIChat: Error sending message:", errorMessage);
      setError(errorMessage);
      const errorUiMessage: AIMessage = {
        id: uuidv4(),
        text: `Error: ${errorMessage}`,
        sender: 'system',
        timestamp: new Date(),
        type: 'error',
      };
      setUiMessages(prev => [...prev, errorUiMessage]);
      // Decide if this error means we should add a synthetic error response to snowganderHistory
      // For now, only actual AI responses are added.
    } finally {
      setIsLoading(false);
    }
  }, [projectId, snowganderHistory]); // snowganderHistory is a dependency

  const clearChat = useCallback(() => {
    setUiMessages([]);
    setSnowganderHistory([]);
    setError(null);
    setIsLoading(false);
  }, []);


  return {
    uiMessages,
    snowganderHistory,
    isLoading,
    error,
    sendUserMessage,
    setUiMessages,
    setSnowganderHistory,
    clearChat,
  };
}
