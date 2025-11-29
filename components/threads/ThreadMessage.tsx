'use client';

import type { Message } from '@/types';

interface ThreadMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
  hasError?: boolean;
}

export function ThreadMessage({
  message,
  isStreaming = false,
  onRetry,
  hasError = false,
}: ThreadMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`px-3 py-2 ${isUser ? 'bg-zinc-900/50' : 'bg-transparent'}`}>
      {/* Role indicator */}
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`text-xs font-medium ${
            isUser ? 'text-blue-400' : 'text-emerald-400'
          }`}
        >
          {isUser ? 'You' : 'AI'}
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <TypingIndicator />
            Thinking...
          </span>
        )}
      </div>

      {/* Message content */}
      <div className="text-sm text-zinc-300">
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

      {/* Code suggestions - will be rendered when they exist */}
      {message.suggestions && message.suggestions.length > 0 && (
        <div className="mt-3 rounded border border-zinc-700 bg-zinc-800/50 p-2">
          <span className="text-xs text-zinc-500">
            {message.suggestions.length} code suggestion
            {message.suggestions.length > 1 ? 's' : ''} available
          </span>
        </div>
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
  let codeBlockLang = '';

  lines.forEach((line, index) => {
    // Code block handling
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-2 overflow-x-auto rounded bg-zinc-800 p-2 text-xs"
          >
            <code className="text-zinc-300">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        codeBlockLang = line.slice(3).trim();
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
        <h3 key={index} className="mt-3 mb-1 text-sm font-semibold text-zinc-200">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="mt-3 mb-1 text-sm font-semibold text-zinc-200">
          {line.slice(3)}
        </h2>
      );
      return;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={index} className="ml-4 text-zinc-300">
          {formatInlineCode(line.slice(2))}
        </li>
      );
      return;
    }

    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      elements.push(
        <li key={index} className="ml-4 list-decimal text-zinc-300">
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
      <p key={index} className="text-zinc-300">
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
        <code key={i} className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-emerald-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-zinc-200">
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
