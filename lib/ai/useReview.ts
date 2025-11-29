'use client';

import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/stores';
import { parseResponse } from './parseSuggestions';
import type { ReviewAction } from '@/types';

interface ReviewOptions {
  threadId: string;
  action: ReviewAction;
  customPrompt?: string;
  isFollowUp?: boolean;
}

interface ReviewState {
  isStreaming: boolean;
  error: string | null;
  activeThreadId: string | null;
  activeMessageId: string | null;
}

export function useReview() {
  const [state, setState] = useState<ReviewState>({
    isStreaming: false,
    error: null,
    activeThreadId: null,
    activeMessageId: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const { addMessage, updateMessageContent, setMessageSuggestions, setMessageOutsideNotes } = useAppStore();

  const startReview = useCallback(
    async (options: ReviewOptions) => {
      const { threadId, action, customPrompt, isFollowUp } = options;

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Get fresh state from store (not from closure, which may be stale)
      const { editor, threads } = useAppStore.getState();

      // Find the thread
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) {
        setState((s) => ({ ...s, error: 'Thread not found' }));
        return;
      }

      // Create empty assistant message
      const messageId = addMessage(threadId, {
        role: 'assistant',
        content: '',
      });

      setState({
        isStreaming: true,
        error: null,
        activeThreadId: threadId,
        activeMessageId: messageId,
      });

      try {
        // Build request body
        const requestBody = {
          selectedCode: thread.originalCode,
          fullCode: editor.code,
          language: editor.language,
          action,
          customPrompt,
          startLine: thread.startLine,
          endLine: thread.endLine,
          threadHistory: isFollowUp ? thread.messages : undefined,
        };

        const response = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        // Process the stream (plain text from toTextStreamResponse)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          updateMessageContent(threadId, messageId, fullContent);
        }

        // Parse suggestions and outside notes from the final content
        const { suggestions, outsideNotes } = parseResponse(fullContent, thread.originalCode);
        if (suggestions.length > 0) {
          setMessageSuggestions(threadId, messageId, suggestions);
        }
        if (outsideNotes.length > 0) {
          setMessageOutsideNotes(threadId, messageId, outsideNotes);
        }

        setState({
          isStreaming: false,
          error: null,
          activeThreadId: null,
          activeMessageId: null,
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't update state
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({
          isStreaming: false,
          error: errorMessage,
          activeThreadId: threadId,
          activeMessageId: messageId,
        });

        // Update the message content with error indicator
        updateMessageContent(
          threadId,
          messageId,
          'Sorry, an error occurred while generating the response. Please try again.'
        );
      }
    },
    [addMessage, updateMessageContent, setMessageSuggestions, setMessageOutsideNotes]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const retry = useCallback(
    (options: ReviewOptions) => {
      startReview(options);
    },
    [startReview]
  );

  return {
    ...state,
    startReview,
    abort,
    retry,
  };
}
