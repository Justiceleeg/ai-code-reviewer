import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import type {
  AppState,
  Thread,
  Message,
  ThreadStatus,
  ReviewAction,
  Theme,
} from '@/types';

// Generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Initial editor state
const initialEditorState = {
  code: '',
  language: 'plaintext',
  fileName: 'untitled',
};

// Initial app state
const initialState: AppState = {
  editor: initialEditorState,
  threads: [],
  theme: 'dark',
};

// Store actions interface
interface AppActions {
  // Editor actions
  setCode: (code: string) => void;
  setLanguage: (language: string) => void;
  setFileName: (fileName: string) => void;

  // Thread actions
  createThread: (
    startLine: number,
    endLine: number,
    action: ReviewAction,
    customPrompt?: string
  ) => string;
  addMessage: (threadId: string, message: Omit<Message, 'id' | 'createdAt'>) => string;
  updateMessageContent: (threadId: string, messageId: string, content: string) => void;
  setMessageSuggestions: (threadId: string, messageId: string, suggestions: Message['suggestions']) => void;
  setMessageOutsideNotes: (threadId: string, messageId: string, notes: Message['outsideNotes']) => void;
  updateThreadStatus: (threadId: string, status: ThreadStatus) => void;
  updateThreadSelection: (threadId: string, startLine: number, endLine: number) => void;
  resolveThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;

  // Suggestion actions
  applySuggestion: (threadId: string, messageId: string, suggestionId: string) => void;

  // Session actions
  clearSession: () => void;
  setTheme: (theme: Theme) => void;
}

// Combined store type
type AppStore = AppState & AppActions;

// Create the store with persistence
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Editor actions
      setCode: (code: string) => {
        const currentCode = get().editor.code;

        set((state) => ({
          editor: { ...state.editor, code },
        }));

        // Check for outdated threads when code changes
        if (currentCode !== code) {
          const threads = get().threads;
          const codeLines = code.split('\n');

          threads.forEach((thread) => {
            if (thread.status === 'resolved') return;

            // Get current code at thread's line range
            const currentCodeAtRange = codeLines
              .slice(thread.startLine - 1, thread.endLine)
              .join('\n');

            // Mark as outdated if code changed
            if (currentCodeAtRange !== thread.originalCode) {
              set((state) => ({
                threads: state.threads.map((t) =>
                  t.id === thread.id ? { ...t, status: 'outdated' as ThreadStatus } : t
                ),
              }));
            }
          });
        }
      },

      setLanguage: (language: string) =>
        set((state) => ({
          editor: { ...state.editor, language },
        })),

      setFileName: (fileName: string) =>
        set((state) => ({
          editor: { ...state.editor, fileName },
        })),

      // Thread actions
      createThread: (
        startLine: number,
        endLine: number,
        action: ReviewAction,
        customPrompt?: string
      ) => {
        const threadId = generateId();
        const code = get().editor.code;
        const codeLines = code.split('\n');
        const originalCode = codeLines.slice(startLine - 1, endLine).join('\n');

        // Create initial user message based on action
        let userContent: string;
        switch (action) {
          case 'explain':
            userContent = 'Explain this code';
            break;
          case 'bugs':
            userContent = 'Find bugs in this code';
            break;
          case 'improve':
            userContent = 'Improve this code';
            break;
          case 'custom':
            userContent = customPrompt || 'Review this code';
            break;
        }

        const newThread: Thread = {
          id: threadId,
          startLine,
          endLine,
          status: 'active',
          originalCode,
          messages: [
            {
              id: generateId(),
              role: 'user',
              content: userContent,
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
        };

        set((state) => ({
          threads: [...state.threads, newThread],
        }));

        return threadId;
      },

      addMessage: (threadId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
        const messageId = generateId();
        const newMessage: Message = {
          ...message,
          id: messageId,
          createdAt: new Date(),
        };

        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? { ...thread, messages: [...thread.messages, newMessage] }
              : thread
          ),
        }));

        return messageId;
      },

      updateMessageContent: (threadId: string, messageId: string, content: string) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg
                  ),
                }
              : thread
          ),
        }));
      },

      setMessageSuggestions: (
        threadId: string,
        messageId: string,
        suggestions: Message['suggestions']
      ) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, suggestions } : msg
                  ),
                }
              : thread
          ),
        }));
      },

      setMessageOutsideNotes: (
        threadId: string,
        messageId: string,
        outsideNotes: Message['outsideNotes']
      ) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, outsideNotes } : msg
                  ),
                }
              : thread
          ),
        }));
      },

      updateThreadStatus: (threadId: string, status: ThreadStatus) =>
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId ? { ...thread, status } : thread
          ),
        })),

      updateThreadSelection: (threadId: string, startLine: number, endLine: number) => {
        const code = get().editor.code;
        const codeLines = code.split('\n');
        const originalCode = codeLines.slice(startLine - 1, endLine).join('\n');

        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  startLine,
                  endLine,
                  originalCode,
                  status: 'active' as ThreadStatus,
                }
              : thread
          ),
        }));
      },

      resolveThread: (threadId: string) =>
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId ? { ...thread, status: 'resolved' as ThreadStatus } : thread
          ),
        })),

      deleteThread: (threadId: string) =>
        set((state) => ({
          threads: state.threads.filter((thread) => thread.id !== threadId),
        })),

      // Suggestion actions
      applySuggestion: (threadId: string, messageId: string, suggestionId: string) => {
        const state = get();
        const thread = state.threads.find((t) => t.id === threadId);
        if (!thread) return;

        const message = thread.messages.find((m) => m.id === messageId);
        if (!message || !message.suggestions) return;

        const suggestion = message.suggestions.find((s) => s.id === suggestionId);
        if (!suggestion || suggestion.applied) return;

        // Get the original code's base indentation from the first line
        const code = state.editor.code;
        const codeLines = code.split('\n');
        const originalFirstLine = codeLines[thread.startLine - 1] || '';
        const baseIndentMatch = originalFirstLine.match(/^(\s*)/);
        const baseIndent = baseIndentMatch ? baseIndentMatch[1] : '';

        // Get the suggestion's indentation from its first line
        const suggestedLines = suggestion.suggested.split('\n');
        const suggestionFirstLine = suggestedLines[0] || '';
        const suggestionIndentMatch = suggestionFirstLine.match(/^(\s*)/);
        const suggestionIndent = suggestionIndentMatch ? suggestionIndentMatch[1] : '';

        // Apply base indentation to suggestion if needed
        let adjustedSuggestionLines = suggestedLines;
        if (baseIndent && baseIndent !== suggestionIndent) {
          // Calculate the difference and adjust each line
          adjustedSuggestionLines = suggestedLines.map((line, index) => {
            if (line.trim() === '') return line; // Keep empty lines as-is
            // Remove suggestion's indent and add base indent
            const lineWithoutIndent = line.replace(/^\s*/, '');
            const lineIndentMatch = line.match(/^(\s*)/);
            const lineIndent = lineIndentMatch ? lineIndentMatch[1] : '';
            // Calculate relative indent from suggestion's first line
            const relativeIndent = lineIndent.length > suggestionIndent.length
              ? lineIndent.slice(suggestionIndent.length)
              : '';
            return baseIndent + relativeIndent + lineWithoutIndent;
          });
        }

        // Calculate line difference
        const originalLineCount = thread.endLine - thread.startLine + 1;
        const newLineCount = adjustedSuggestionLines.length;
        const lineDiff = newLineCount - originalLineCount;

        // Apply the suggestion to the code
        const before = codeLines.slice(0, thread.startLine - 1);
        const after = codeLines.slice(thread.endLine);
        const newCode = [...before, ...adjustedSuggestionLines, ...after].join('\n');

        // Update code
        set((s) => ({
          editor: { ...s.editor, code: newCode },
        }));

        // Update thread's end line
        const newEndLine = thread.startLine + newLineCount - 1;
        const adjustedSuggestion = adjustedSuggestionLines.join('\n');

        // Update all threads in one operation:
        // - Mark suggestion as applied for current thread
        // - Update line range for current thread
        // - Shift line numbers for threads that come after this one
        set((s) => ({
          threads: s.threads.map((t) => {
            if (t.id === threadId) {
              // Update the current thread
              return {
                ...t,
                endLine: newEndLine,
                originalCode: adjustedSuggestion,
                messages: t.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        suggestions: m.suggestions?.map((sug) =>
                          sug.id === suggestionId ? { ...sug, applied: true } : sug
                        ),
                      }
                    : m
                ),
              };
            } else if (t.startLine > thread.endLine && lineDiff !== 0) {
              // Shift threads that come after the modified range
              return {
                ...t,
                startLine: t.startLine + lineDiff,
                endLine: t.endLine + lineDiff,
              };
            }
            return t;
          }),
        }));
      },

      // Session actions
      clearSession: () =>
        set({
          ...initialState,
        }),

      setTheme: (theme: Theme) =>
        set({
          theme,
        }),
    }),
    {
      name: 'ai-code-review-storage',
      storage: createJSONStorage(() => localStorage),
      // Handle Date serialization
      partialize: (state) => ({
        editor: state.editor,
        threads: state.threads,
        theme: state.theme,
      }),
    }
  )
);

// Hook to handle SSR hydration mismatch
// Returns true when the store has been hydrated from localStorage
export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if persist has finished rehydration
    const unsubFinishHydration = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Also check if already hydrated (in case effect runs after hydration)
    setHydrated(useAppStore.persist.hasHydrated());

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}
