# AI Code Review

A web application that provides intelligent, contextual code review feedback. Users paste or drag code into an editor, select specific lines, and receive AI-powered feedback through inline conversation threads.

## Features

- **Monaco Editor** - Full-featured code editor with syntax highlighting for all major languages
- **AI-Powered Reviews** - Get explanations, find bugs, suggestions for improvement, or ask custom questions
- **Conversation Threads** - Multiple threads per file, linked to specific line ranges
- **Code Suggestions** - AI can suggest code changes with diff preview and one-click apply
- **Persistent Sessions** - All state saved to localStorage automatically
- **Export** - Export all threads as markdown
- **Dark/Light Themes** - Toggle between dark and light mode

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-code-reviewer
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

4. Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=sk-proj-your-key-here
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Add Code** - Paste code directly, type in the editor, or drag and drop a file
2. **Select Lines** - Click and drag to select the lines you want reviewed
3. **Right-Click** - Open the context menu on your selection
4. **Choose an Action**:
   - **Explain** - Get a clear explanation of what the code does
   - **Find bugs** - Identify potential issues and bugs
   - **Improve** - Get suggestions for improvements
   - **Custom** - Ask your own question about the code
5. **Review Thread** - The AI response appears in the side panel
6. **Follow Up** - Continue the conversation in the thread
7. **Apply Suggestions** - If the AI suggests code changes, preview the diff and apply with one click

### Thread States

- **Active** (green) - Ongoing conversation
- **Outdated** (yellow) - The code at this location has changed since the thread was created
- **Resolved** (gray) - Thread has been marked as resolved

### Updating Outdated Threads

When you edit code that a thread references, the thread becomes "outdated". To fix:
1. Click on the outdated thread
2. Click "Update Selection" in the yellow banner
3. Select the new line range in the editor
4. Click "Apply Selection"

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for GPT-4 access |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: Tailwind CSS v4
- **Editor**: Monaco Editor
- **AI**: Vercel AI SDK with OpenAI
- **State**: Zustand v5
- **Package Manager**: pnpm

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Known Limitations

- **Desktop Only** - No mobile or tablet support
- **Single File** - No multi-file support
- **1000 Line Limit** - Maximum of 1000 lines per file
- **No Authentication** - Sessions are stored in localStorage only
- **No Git Integration** - Copy code manually to apply changes to your project

## Project Structure

```
app/
├── api/review/       # AI review API endpoint
├── layout.tsx        # Root layout
├── page.tsx          # Main page
└── globals.css       # Global styles

components/
├── editor/           # Code editor components
├── threads/          # Thread panel and messages
├── suggestions/      # Diff view and suggestions
├── header/           # App header and controls
└── ui/               # Shared UI components

lib/
├── ai/               # AI client and prompts
├── editor/           # Language detection
└── export/           # Markdown export

stores/
└── useAppStore.ts    # Zustand state management

types/
└── index.ts          # TypeScript interfaces
```

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in [Vercel](https://vercel.com/new)
3. Add your `OPENAI_API_KEY` environment variable in Vercel's project settings
4. Deploy

### Other Platforms

Build the production bundle:
```bash
pnpm build
```

Start the production server:
```bash
pnpm start
```

Note: Ensure your deployment platform supports Node.js and can serve Next.js applications.

## Development

### Code Style

- One component per file, max 150 lines
- Barrel exports (`index.ts`) in each component folder
- Business logic in `lib/`, UI in `components/`
- TypeScript strict mode enabled

### Common Pitfalls

1. **Monaco SSR** - Must use dynamic import with `ssr: false`
2. **Zustand Hydration** - Handle SSR/client mismatch with persist middleware
3. **useEffect Loops** - Be careful with dependencies that recreate each render

## License

MIT
