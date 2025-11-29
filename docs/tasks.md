# AI Code Review - Implementation Plan

## Overview

This document outlines the implementation tasks for AI Code Review. Tasks are organized into phases with dependencies noted. Each task is sized for focused implementation sessions.

**Estimated Total Tasks:** 45+
**Phases:** 8

---

## Phase 1: Project Setup

### 1.1 Initialize Next.js Project
- [x] Create Next.js 16 app with App Router (`pnpm create next-app@latest`)
- [x] Configure TypeScript strict mode
- [x] Set up folder structure per PRD (app/, components/, lib/, stores/, types/ at root level)
- [x] Create barrel exports (index.ts) for each folder

### 1.2 Install Dependencies
- [x] Install Tailwind CSS v4 and configure
- [x] Install Zustand v5
- [x] Install Monaco Editor (`@monaco-editor/react`)
- [x] Install Vercel AI SDK (`pnpm add ai @ai-sdk/openai`)

### 1.3 Environment Setup
- [x] Create `.env.local` with `OPENAI_API_KEY`
- [x] Create `.env.example` for documentation
- [x] Add `.env.local` to `.gitignore`

### 1.4 Base Layout
- [x] Create root layout with dark theme default
- [x] Set up global styles (Tailwind base)
- [x] Create responsive container (desktop-only)
- [x] Add app metadata (title, description)

**Phase 1 Deliverable:** Empty app shell with all dependencies installed and configured.

---

## Phase 2: Type Definitions & Store

### 2.1 Core Types
- [x] Define `Thread` interface
- [x] Define `Message` interface
- [x] Define `CodeSuggestion` interface
- [x] Define `EditorState` interface
- [x] Define `AppState` interface
- [x] Define `ThreadStatus` type ('active' | 'outdated' | 'resolved')
- [x] Define `ReviewAction` type ('explain' | 'bugs' | 'improve' | 'custom')

### 2.2 Zustand Store
- [x] Create `useAppStore` with initial state
- [x] Implement editor state actions:
  - `setCode(code: string)`
  - `setLanguage(language: string)`
  - `setFileName(fileName: string)`
- [x] Implement thread actions:
  - `createThread(startLine, endLine, action, customPrompt?)`
  - `addMessage(threadId, message)`
  - `updateThreadStatus(threadId, status)`
  - `updateThreadSelection(threadId, startLine, endLine)`
  - `resolveThread(threadId)`
- [x] Implement suggestion actions:
  - `applySuggestion(threadId, messageId, suggestionId)`
- [x] Implement session actions:
  - `clearSession()`
  - `setTheme(theme)`

### 2.3 localStorage Persistence
- [x] Create localStorage middleware for Zustand
- [x] Implement state hydration on app load
- [x] Handle hydration mismatch (SSR vs client)
- [x] Test persistence across page refreshes

**Phase 2 Deliverable:** Fully typed store with persistence, no UI yet.

---

## Phase 3: Code Editor

### 3.1 Monaco Editor Setup
- [x] Create `CodeEditor` component wrapper
- [x] Configure Monaco for multi-language support
- [x] Set up dark/light theme switching
- [x] Configure editor options (line numbers, minimap off, word wrap)
- [x] Handle controlled value with proper diffing

### 3.2 File Input
- [x] Implement paste handling (already works by default)
- [x] Implement drag-and-drop file upload
- [x] Read file content and detect language from extension
- [x] Set filename from dropped file
- [x] Show placeholder text when empty

### 3.3 Language Detection
- [x] Create `languageDetection.ts` utility
- [x] Implement extension-based detection
- [x] Implement content-based heuristics (shebang, keywords)
- [x] Map detected language to Monaco language ID

### 3.4 Selection Tracking
- [x] Track current selection (start/end line)
- [x] Expose selection state to parent
- [x] Highlight selected lines visually
- [x] Clear selection when clicking outside

### 3.5 Line Limit Enforcement
- [x] Check line count on code change
- [x] Show warning when approaching 1000 lines
- [x] Truncate or prevent paste beyond limit
- [x] Display current line count

**Phase 3 Deliverable:** Functional code editor with file input, language detection, and selection tracking.

---

## Phase 4: Thread Panel

### 4.1 Panel Layout
- [x] Create `ThreadPanel` component (right side)
- [x] Implement resizable width (drag handle)
- [x] Store panel width preference
- [x] Handle collapsed/expanded panel state

### 4.2 Thread List
- [x] Create `ThreadList` component
- [x] Sort threads by start line number
- [x] Render `ThreadItem` for each thread
- [x] Handle empty state (no threads yet)

### 4.3 Thread Item (Collapsed)
- [x] Create `ThreadItem` component
- [x] Display line range ("Lines 5-12")
- [x] Display message count
- [x] Show status indicator (active/outdated/resolved)
- [x] Yellow banner for outdated (visible when collapsed)
- [x] Distinct styling for resolved
- [x] Click to expand

### 4.4 Thread Item (Expanded)
- [x] Show full message history
- [x] Render `ThreadMessage` for each message
- [x] Show text input for follow-up
- [x] Show kebab menu (three dots)
- [x] Scroll to bottom on new messages

### 4.5 Thread Message
- [x] Create `ThreadMessage` component
- [x] Style user messages vs AI messages
- [x] Render markdown in AI responses
- [x] Show typing indicator during streaming
- [x] Show retry button on error

### 4.6 Kebab Menu
- [x] Create kebab menu dropdown
- [x] "Resolve" option (always visible)
- [x] "Update Selection" option (outdated threads only)
- [x] Handle menu positioning
- [x] "Delete" option to remove thread entirely

### 4.7 Gutter Markers
- [x] Add visual indicators in editor gutter for threads
- [x] Color-code by status (active/outdated/resolved)
- [x] Click gutter marker to scroll panel to thread

**Phase 4 Deliverable:** Complete thread panel with all states and interactions (no AI yet).

---

## Phase 5: Context Menu & Thread Creation

### 5.1 Context Menu Component
- [x] Create `ContextMenu` component
- [x] Position near right-click location
- [x] Close on click outside
- [x] Close on escape key

### 5.2 Menu Options
- [x] "Explain" option
- [x] "Find bugs" option
- [x] "Improve" option
- [x] "Custom..." option (opens input)
- [x] Disable menu when no selection

### 5.3 Custom Prompt Input
- [x] Create inline input for custom prompts
- [x] Auto-focus on open
- [x] Submit on Enter
- [x] Cancel on Escape

### 5.4 Thread Creation Flow
- [x] On menu action, create new thread in store
- [x] Capture selected code range
- [x] Store original code text (for outdated detection)
- [x] Scroll panel to new thread
- [x] Trigger AI request

**Phase 5 Deliverable:** Right-click menu that creates threads and triggers AI (AI integration in next phase).

---

## Phase 6: AI Integration

### 6.1 API Route Setup
- [x] Create `POST /api/review` route handler
- [x] Validate request body (action, code, selection, threadHistory)
- [x] Use `streamText()` from Vercel AI SDK with OpenAI provider
- [x] Return `result.toTextStreamResponse()` for automatic streaming
- [x] Handle errors gracefully (invalid API key, rate limits)

### 6.2 Prompt Engineering
- [x] Create `prompts.ts` with system prompt and action templates
- [x] Define prompt for each action:
  - Explain: clear explanation of what the code does
  - Find bugs: identify issues with optional fix suggestions
  - Improve: suggest improvements or confirm code looks good
  - Custom: answer user's specific question
- [x] Include context in user message: selected code, full file (truncated if needed), language
- [x] Format thread history as conversation messages for follow-ups
- [x] Instruct AI to wrap code suggestions in markdown code blocks with `suggestion` label

### 6.3 Client Integration
- [x] Create `useReview` hook using custom fetch with stream handling
- [x] Stream response text directly into message content in store
- [x] Handle loading state (isStreaming flag)
- [x] Handle error state with retry capability
- [x] Abort in-flight requests on new request or unmount

### 6.4 Response Parsing (Post-Stream)
- [x] Create `parseSuggestions.ts` utility
- [x] Extract code blocks marked as suggestions from completed response
- [x] Support multiple suggestion alternatives (numbered or separate blocks)
- [x] Structure into `CodeSuggestion` objects with original/suggested code
- [x] Handle responses with no code suggestions (explanation only)

### 6.5 Thread Integration
- [x] Trigger AI request on thread creation (from context menu)
- [x] Add streaming message to thread immediately (empty, then fill)
- [x] Parse suggestions after stream completes, attach to message
- [x] Support follow-up messages with full thread history as context

**Phase 6 Deliverable:** Working AI integration with streaming responses and parsed suggestions.

---

## Phase 7: Code Suggestions & Diff View

### 7.1 Diff View Component
- [x] Create `DiffView` component using Monaco diff editor
- [x] Configure inline mode (`renderSideBySide: false`)
- [x] Pass original and suggested code
- [x] Match editor theme

### 7.2 Suggestion Carousel
- [x] Create `SuggestionCarousel` component
- [x] Display "1 of 3" indicator
- [x] Previous/Next navigation
- [x] Show current suggestion in diff view

### 7.3 Apply Flow
- [x] Add "Apply" button below diff
- [x] On apply, update code in editor
- [x] Mark suggestion as applied
- [x] Keep thread open for follow-up

### 7.4 Code Update Logic
- [x] Replace only the selected line range
- [x] Preserve surrounding code
- [x] Update line numbers for other threads if affected
- [x] Handle edge cases (empty lines, whitespace)

### 7.5 Outside Recommendations
- [x] Display AI notes about changes outside selection as info banner
- [x] Non-actionable (informational only, parsed in Phase 6.4)

**Phase 7 Deliverable:** Full suggestion flow with diff preview and apply.

---

## Phase 8: Header, Export & Polish

### 8.1 App Header
- [ ] Create `AppHeader` component
- [ ] Display "AI Code Review" title
- [ ] File name (editable inline)
- [ ] Language indicator badge
- [ ] Theme toggle (sun/moon icons)
- [ ] Export button
- [ ] Copy code button
- [ ] Clear session button

### 8.2 Theme Toggle
- [ ] Create `ThemeToggle` component
- [ ] Toggle between dark/light
- [ ] Update Monaco theme
- [ ] Persist preference
- [ ] Apply Tailwind dark mode

### 8.3 Export Threads
- [ ] Create `markdown.ts` export utility
- [ ] Format threads oldest to newest
- [ ] Include: line range, user prompts, AI responses
- [ ] Include code suggestions (applied or not)
- [ ] Trigger download as `.md` file

### 8.4 Copy Code
- [ ] Create copy-to-clipboard function
- [ ] Copy current code state
- [ ] Show toast/confirmation on success

### 8.5 Clear Session
- [ ] Create `ConfirmDialog` component
- [ ] Show confirmation before clearing
- [ ] Clear store and localStorage
- [ ] Reset to empty state

### 8.6 Outdated Detection
- [ ] Compare current code at line range to stored original
- [ ] Mark thread as outdated if different
- [ ] Trigger on any code change
- [ ] Efficient diffing (avoid unnecessary checks)

### 8.7 Update Selection Flow
- [ ] Enter "selection mode" from kebab menu
- [ ] Highlight current (stale) selection
- [ ] User selects new range
- [ ] Update thread line range
- [ ] Clear outdated status
- [ ] Exit selection mode

**Phase 8 Deliverable:** Complete application with all features.

---

## Phase 9: Testing & Deployment

### 9.1 Manual Testing
- [ ] Test full user flow end-to-end
- [ ] Test all four review actions
- [ ] Test thread states (active, outdated, resolved)
- [ ] Test multiple overlapping threads
- [ ] Test code suggestions and apply
- [ ] Test export and copy
- [ ] Test persistence across refresh
- [ ] Test clear session
- [ ] Test theme toggle

### 9.2 Edge Cases
- [ ] Empty code submission
- [ ] Very long responses
- [ ] Network failures
- [ ] Invalid selections
- [ ] Rapid consecutive requests
- [ ] Large files (near 1000 lines)

### 9.3 Vercel Deployment
- [ ] Create Vercel project
- [ ] Configure environment variables
- [ ] Deploy and verify
- [ ] Test production build

### 9.4 Documentation
- [ ] Write README with setup instructions
- [ ] Document environment variables
- [ ] Add usage examples
- [ ] Note known limitations

**Phase 9 Deliverable:** Deployed, documented application.

---

## Task Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Types & Store)
    ↓
Phase 3 (Editor) ←──────────────────┐
    ↓                               │
Phase 4 (Thread Panel) ─────────────┤
    ↓                               │
Phase 5 (Context Menu) ─────────────┤
    ↓                               │
Phase 6 (AI Integration) ───────────┤
    ↓                               │
Phase 7 (Suggestions & Diff) ───────┘
    ↓
Phase 8 (Header, Export, Polish)
    ↓
Phase 9 (Testing & Deployment)
```

**Notes:**
- Phases 3-7 can have some parallel work but have interdependencies
- Phase 6 (AI) can start early with mock responses
- Phase 8 has mostly independent tasks

---

## Implementation Notes

### For AI Coding Assistants

1. **One task at a time** - Complete and test each checkbox before moving on
2. **Small files** - Keep components under 150 lines
3. **Types first** - Always define types before implementation
4. **Test incrementally** - Verify each feature works before building on it
5. **Avoid useEffect pitfalls** - Be careful with dependencies to prevent loops

### Key Technical Considerations

1. **Monaco SSR** - Monaco doesn't support SSR; use dynamic imports with `ssr: false`
2. **Hydration** - Zustand persist middleware needs hydration handling
3. **AI SDK Streaming** - Use Vercel AI SDK's `streamText()` and `toDataStreamResponse()` - no manual SSE needed
4. **Selection state** - Monaco selection events fire frequently; debounce if needed
5. **Suggestion Parsing** - Parse code suggestions from markdown after stream completes, not during

---

## Progress Tracking

**Started:** 2025-11-28
**Current Phase:** Phase 7 Complete
**Completed Phases:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, Phase 7

---

_Last updated: 2025-11-29 - Completed Phase 7 (Code Suggestions & Diff View)_
