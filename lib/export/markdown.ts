import type { Thread, Message, CodeSuggestion } from '@/types';

interface ExportOptions {
  fileName: string;
  language: string;
  threads: Thread[];
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

function formatSuggestion(suggestion: CodeSuggestion, index: number): string {
  const status = suggestion.applied ? '(Applied)' : '(Not applied)';
  return `
**Suggestion ${index + 1}** ${status}

\`\`\`diff
- ${suggestion.original.split('\n').join('\n- ')}
+ ${suggestion.suggested.split('\n').join('\n+ ')}
\`\`\`
`;
}

function formatMessage(message: Message): string {
  const role = message.role === 'user' ? 'You' : 'AI';
  const timestamp = formatDate(message.createdAt);

  let output = `**${role}** (${timestamp}):\n\n${message.content}\n`;

  // Add suggestions if present
  if (message.suggestions && message.suggestions.length > 0) {
    output += '\n#### Code Suggestions\n';
    message.suggestions.forEach((suggestion, index) => {
      output += formatSuggestion(suggestion, index);
    });
  }

  // Add outside notes if present
  if (message.outsideNotes && message.outsideNotes.length > 0) {
    output += '\n#### Notes (changes needed outside selection)\n';
    message.outsideNotes.forEach((note) => {
      output += `- ${note}\n`;
    });
  }

  return output;
}

function formatThread(thread: Thread, index: number): string {
  const statusEmoji = {
    active: '',
    outdated: ' (Outdated)',
    resolved: ' (Resolved)',
  };

  const status = statusEmoji[thread.status];
  const timestamp = formatDate(thread.createdAt);

  let output = `## Thread ${index + 1}: Lines ${thread.startLine}-${thread.endLine}${status}\n\n`;
  output += `*Created: ${timestamp}*\n\n`;
  output += `**Original Code:**\n\n\`\`\`\n${thread.originalCode}\n\`\`\`\n\n`;
  output += `### Conversation\n\n`;

  // Sort messages by creation time (oldest first)
  const sortedMessages = [...thread.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedMessages.forEach((message) => {
    output += formatMessage(message);
    output += '\n---\n\n';
  });

  return output;
}

export function exportToMarkdown({ fileName, language, threads }: ExportOptions): string {
  const now = new Date().toLocaleString();

  let output = `# AI Code Review Export\n\n`;
  output += `**File:** ${fileName}\n`;
  output += `**Language:** ${language}\n`;
  output += `**Exported:** ${now}\n`;
  output += `**Total Threads:** ${threads.length}\n\n`;
  output += `---\n\n`;

  if (threads.length === 0) {
    output += '*No review threads to export.*\n';
    return output;
  }

  // Sort threads by creation time (oldest first)
  const sortedThreads = [...threads].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedThreads.forEach((thread, index) => {
    output += formatThread(thread, index);
  });

  return output;
}

export function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-review.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
