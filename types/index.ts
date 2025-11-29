// Shared type definitions

// Thread status for conversation threads
export type ThreadStatus = 'active' | 'outdated' | 'resolved';

// Review action types for context menu
export type ReviewAction = 'explain' | 'bugs' | 'improve' | 'custom';

// Theme preference
export type Theme = 'dark' | 'light';

// Code suggestion from AI response
export interface CodeSuggestion {
  id: string;
  original: string;
  suggested: string;
  applied: boolean;
}

// Individual message in a thread
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: CodeSuggestion[];
  createdAt: Date;
}

// Conversation thread for a code selection
export interface Thread {
  id: string;
  startLine: number;
  endLine: number;
  status: ThreadStatus;
  originalCode: string; // For outdated detection
  messages: Message[];
  createdAt: Date;
}

// Editor state
export interface EditorState {
  code: string;
  language: string;
  fileName: string;
}

// Full application state
export interface AppState {
  editor: EditorState;
  threads: Thread[];
  theme: Theme;
}
