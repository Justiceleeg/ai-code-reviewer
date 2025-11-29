# AI Code Review - Product Requirements Document

## 1. Overview

**Product Name:** AI Code Review

**Summary:** A web application that provides intelligent, contextual code review feedback. Users paste or drag code into an editor, select specific lines, and receive AI-powered feedback through inline conversation threads.

**Target User:** Solo developers seeking quick, contextual feedback on code snippets.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS v4 |
| Editor | Monaco Editor |
| AI SDK | Vercel AI SDK (`ai` + `@ai-sdk/openai`) |
| State | Zustand v5 |
| Package Manager | pnpm |
| Deployment | Vercel |

---

## 3. User Flow

1. User opens app → sees empty editor with placeholder text
2. User pastes code, types code, or drags in a file
3. Language is auto-detected (user can override)
4. User selects lines of code
5. User right-clicks → context menu appears
6. User chooses: Explain | Find bugs | Improve | Custom
7. Thread appears in side panel with AI response (streaming)
8. User can follow up in thread or select new code for new thread
9. If AI suggests code changes, user sees diff view → can apply
10. User can export threads as markdown or copy final code
11. Session persists to localStorage automatically

---

## 4. Feature Specifications

### 4.1 Code Editor

**Input Methods:**
- Paste code directly
- Type in editor
- Drag and drop file

**Editor Features:**
- Syntax highlighting (all languages)
- Line numbers
- Auto language detection with manual override
- File name display (editable)
- Dark/light theme toggle (default: dark)

**Constraints:**
- Maximum 1000 lines
- Desktop only (no mobile/tablet support)

**Behavior:**
- Code remains editable while threads exist
- Editing code marks affected threads as "outdated"

---

### 4.2 Selection & Context Menu

**Selection:**
- Click and drag to select lines
- Selection highlights in editor
- No selection = context menu disabled

**Right-Click Context Menu Options:**

| Action | Behavior |
|--------|----------|
| Explain | AI explains what the selected code does |
| Find bugs | AI identifies potential issues (may or may not suggest fixes) |
| Improve | AI suggests improvements (may just say "looks good") |
| Custom | Opens text input for free-form question |

**Context Sent to AI:**
- Selected code (primary focus)
- Full file content (for context)
- Language
- Thread history (for follow-ups)

---

### 4.3 Thread Panel

**Layout:**
- Side panel on right of editor
- Resizable width
- Threads sorted by line number (top to bottom)

**Collapsed Thread Display:**
- Line range (e.g., "Lines 5-12")
- Thread count indicator
- Outdated indicator (yellow) if applicable
- Resolved indicator if applicable

**Expanded Thread Display:**
- Full conversation history
- User prompts and AI responses
- Code suggestions with diff view (if any)
- Text input for follow-up questions
- Kebab menu (three dots) with actions

**Kebab Menu Actions:**
- Resolve thread
- Update Selection (only visible for outdated threads)

---

### 4.4 Thread States

| State | Description | Visual Treatment |
|-------|-------------|------------------|
| Active | Ongoing conversation | Default styling |
| Outdated | Code at thread's lines was edited | Yellow banner (visible collapsed and expanded) |
| Resolved | User marked as done | Distinct styling, frozen (no further interaction) |

**State Rules:**
- Active → Outdated: When user edits code at thread's line range
- Active → Resolved: User clicks "Resolve" or tells AI "resolved"
- Outdated → Active: User updates selection (see recovery flow below)
- Outdated → Resolved: User can resolve without fixing
- Resolved threads are frozen (cannot become outdated, cannot re-open)

**Outdated Recovery Flow:**
1. User clicks on outdated thread
2. Thread expands showing yellow "outdated" banner
3. User clicks "Update Selection" button
4. User selects new line range in editor
5. Thread's line range updates, outdated status clears
6. Conversation continues with same history
7. AI receives updated code context on next message

**Note:** No auto-tracking in v1. User must manually re-select.

---

### 4.5 AI Responses

**Streaming:**
- Responses stream word-by-word
- Typing indicator shown during generation

**Error Handling:**
- On failure: show retry button within thread
- No toast notifications

**Response Types:**
- Text explanation/advice
- Code suggestions (one or multiple alternatives)
- "Looks good" when no improvements needed

**Context for Follow-ups:**
- AI receives full thread history
- AI receives current code state

---

### 4.6 Code Suggestions & Diff View

**When AI Suggests Code:**
- Suggestions scoped to selected lines only
- If AI has recommendations outside selection, include as text note

**Diff View:**
- Use Monaco's built-in diff editor (`createDiffEditor`)
- Inline mode (`renderSideBySide: false`)
- Multiple alternatives supported
- Swipeable with "1 of 3" indicator

**Apply Flow:**
1. User reviews diff
2. User clicks "Apply" to confirm
3. All changes applied at once
4. Thread remains open for follow-up

---

### 4.7 Persistence & Session

**localStorage:**
- Full state saved automatically
- Single session only (no multiple saves)
- Persists: code, threads, file name, language, theme preference

**Clear Session:**
- Button in header
- Confirmation dialog before clearing
- Wipes all state and localStorage

---

### 4.8 Export

**Export Threads (Markdown):**
- All threads included
- Ordered oldest to newest
- Includes: line range, user prompts, AI responses, code suggestions
- Button in header

**Copy Raw Code:**
- Copies current code state to clipboard
- Separate button from thread export
- Reflects all applied changes

---

### 4.9 Header / App Chrome

**Header Contents (left to right):**
- App name: "AI Code Review"
- File name (editable) + language indicator
- Theme toggle (sun/moon icon)
- Export threads button
- Copy code button
- Clear session button

---

## 5. Data Models

```typescript
interface Thread {
  id: string;
  startLine: number;
  endLine: number;
  status: 'active' | 'outdated' | 'resolved';
  originalCode: string; // For outdated detection
  messages: Message[];
  createdAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: CodeSuggestion[];
  createdAt: Date;
}

interface CodeSuggestion {
  id: string;
  original: string;
  suggested: string;
  applied: boolean;
}

interface EditorState {
  code: string;
  language: string;
  fileName: string;
}

interface AppState {
  editor: EditorState;
  threads: Thread[];
  theme: 'dark' | 'light';
}
```

---

## 6. API Design

### POST /api/review

**Request:**
```typescript
{
  selectedCode: string;
  fullCode: string;
  language: string;
  action: 'explain' | 'bugs' | 'improve' | 'custom';
  customPrompt?: string; // For 'custom' action
  threadHistory?: Message[]; // For follow-ups
}
```

**Response:**
- Streaming text response
- Code suggestions embedded in response (parsed client-side)

---

## 7. File Structure (Recommended)

```
app/
├── api/
│   └── review/
│       └── route.ts
├── layout.tsx
├── page.tsx
└── globals.css
components/
├── editor/
│   ├── CodeEditor.tsx
│   ├── LanguageSelector.tsx
│   └── index.ts
├── threads/
│   ├── ThreadPanel.tsx
│   ├── ThreadItem.tsx
│   ├── ThreadMessage.tsx
│   ├── ThreadInput.tsx
│   └── index.ts
├── suggestions/
│   ├── DiffView.tsx
│   ├── SuggestionCarousel.tsx
│   └── index.ts
├── header/
│   ├── AppHeader.tsx
│   ├── ExportButton.tsx
│   ├── ThemeToggle.tsx
│   └── index.ts
└── ui/
    ├── ContextMenu.tsx
    ├── ConfirmDialog.tsx
    └── index.ts
lib/
├── ai/
│   ├── client.ts
│   ├── prompts.ts
│   └── parseResponse.ts
├── editor/
│   └── languageDetection.ts
├── export/
│   └── markdown.ts
└── storage/
    └── localStorage.ts
stores/
└── useAppStore.ts
types/
└── index.ts
```

---

## 8. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| Performance | AI response start < 2s |
| Browser Support | Modern browsers (Chrome, Firefox, Safari, Edge) |
| Accessibility | Not prioritized for v1 |
| Mobile Support | Not supported (desktop only) |
| Analytics | None for v1 |
| Rate Limiting | None client-side (rely on provider limits) |

**Development Note:** Be careful with useEffect dependencies and re-renders to avoid errant API calls.

---

## 9. Out of Scope (v1)

- Multi-file support
- Git/GitHub integration
- Team collaboration
- User authentication
- Database persistence
- Keyboard shortcuts
- Mobile/tablet support
- Import functionality
- Auto-tracking of moved code
- Re-opening resolved threads

---

## 10. Success Criteria

- [ ] User can paste/type/drag code into editor
- [ ] User can select lines and access context menu
- [ ] All four actions work: Explain, Find bugs, Improve, Custom
- [ ] AI responses stream in real-time
- [ ] Multiple threads can exist simultaneously
- [ ] Threads can overlap
- [ ] Code suggestions display in diff view
- [ ] Multiple suggestions are swipeable
- [ ] Apply updates the code
- [ ] Editing code marks threads as outdated
- [ ] Outdated threads can be recovered via "Update Selection"
- [ ] Threads can be resolved
- [ ] State persists to localStorage
- [ ] Export generates readable markdown
- [ ] Copy code works
- [ ] Clear session works with confirmation
- [ ] Theme toggle works

---

## 11. Future Considerations

- Should "Find bugs" have severity levels?
- Smart code tracking for outdated threads (v2)
