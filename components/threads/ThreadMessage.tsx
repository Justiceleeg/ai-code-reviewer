'use client';

import type { Message } from '@/types';
import { SuggestionCarousel } from '@/components/suggestions';

interface ThreadMessageProps {
  message: Message;
  threadId: string;
  isStreaming?: boolean;
  onRetry?: () => void;
  hasError?: boolean;
}

export function ThreadMessage({
  message,
  threadId,
  isStreaming = false,
  onRetry,
  hasError = false,
}: ThreadMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`px-3 py-2 ${isUser ? 'bg-zinc-900/50 light:bg-zinc-100/50' : 'bg-transparent'}`}>
      {/* Role indicator */}
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`text-xs font-medium ${
            isUser ? 'text-blue-400 light:text-blue-600' : 'text-emerald-400 light:text-emerald-600'
          }`}
        >
          {isUser ? 'You' : 'AI'}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-xs text-zinc-500 light:text-zinc-500">
            <TypingIndicator />
            Thinking...
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="text-sm text-zinc-300 light:text-zinc-800">
        {message.content ? (
          <MarkdownContent content={message.content} />
        ) : isStreaming ? (
          <span className="text-zinc-500">...</span>
        ) : null}
      </div>

      {/* Error state with retry */}
      {hasError && onRetry && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-red-400">Failed to get response</span>
          <button
            onClick={onRetry}
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Code suggestions carousel with diff view */}
      {message.suggestions && message.suggestions.length > 0 && !isStreaming && (
        <SuggestionCarousel
          suggestions={message.suggestions}
          threadId={threadId}
          messageId={message.id}
        />
      )}

      {/* Outside recommendations info banner */}
      {message.outsideNotes && message.outsideNotes.length > 0 && !isStreaming && (
        <OutsideNotesBanner notes={message.outsideNotes} />
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-500" />
    </span>
  );
}

interface MarkdownContentProps {
  content: string;
}

function MarkdownContent({ content }: MarkdownContentProps) {
  // Simple markdown rendering for common patterns
  // In a production app, you'd use a library like react-markdown
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let _codeBlockLang = '';

  lines.forEach((line, index) => {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-2 overflow-x-auto rounded bg-zinc-800 p-2 text-xs light:bg-zinc-100"
          >
            <code className="text-zinc-300 light:text-zinc-800">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        _codeBlockLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="mt-3 mb-1 text-sm font-semibold text-zinc-200 light:text-zinc-900">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="mt-3 mb-1 text-sm font-semibold text-zinc-200 light:text-zinc-900">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={index} className="ml-4 text-zinc-300 light:text-zinc-800">
          {formatInlineCode(line.slice(2))}
        </li>
      );
      return;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      elements.push(
        <li key={index} className="ml-4 list-decimal text-zinc-300 light:text-zinc-800">
          {formatInlineCode(line.slice(numberedMatch[0].length))}
        </li>
      );
      return;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<br key={index} />);
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} className="text-zinc-300 light:text-zinc-800">
        {formatInlineCode(line)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

function formatInlineCode(text: string): React.ReactNode {
  // Handle inline code and bold/italic
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-emerald-400 light:bg-zinc-200 light:text-emerald-600">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-200 light:text-zinc-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

interface OutsideNotesBannerProps {
  notes: string[];
}

function OutsideNotesBanner({ notes }: OutsideNotesBannerProps) {
  return (
    <div className="mt-3 rounded border border-blue-500/30 bg-blue-500/10 p-2 light:border-blue-600/30 light:bg-blue-50">
      <div className="mb-1 flex items-center gap-1.5">
        <InfoIcon />
        <span className="text-xs font-medium text-blue-400 light:text-blue-700">
          Additional changes may be needed
        </span>
      </div>
      <div className="space-y-1">
        {notes.map((note, index) => (
          <p key={index} className="text-xs text-blue-300/80 light:text-blue-600">
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-400 light:text-blue-600"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
