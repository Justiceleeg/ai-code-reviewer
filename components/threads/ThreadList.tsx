'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores';
import { ThreadItem } from './ThreadItem';

interface ThreadListProps {
  onThreadClick?: (threadId: string) => void;
  activeThreadId?: string | null;
  streamingMessageId?: string | null;
  onUpdateSelection?: (threadId: string, startLine: number, endLine: number) => void;
}

export function ThreadList({
  onThreadClick,
  activeThreadId,
  streamingMessageId,
  onUpdateSelection,
}: ThreadListProps) {
  const threads = useAppStore(useShallow((state) => state.threads));

  // Sort threads by start line number
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => a.startLine - b.startLine);
  }, [threads]);

  if (sortedThreads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
        <div className="mb-3 rounded-full bg-zinc-800/50 p-3 light:bg-zinc-200/50">
          <MessageIcon />
        </div>
        <p className="text-sm font-medium text-zinc-400 light:text-zinc-700">No threads yet</p>
        <p className="mt-1 text-xs text-zinc-600 light:text-zinc-500">
          Select code and right-click to start a review
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800 light:divide-zinc-200">
      {sortedThreads.map((thread) => (
        <ThreadItem
          key={thread.id}
          thread={thread}
          isActive={thread.id === activeThreadId}
          onClick={() => onThreadClick?.(thread.id)}
          streamingMessageId={streamingMessageId}
          onUpdateSelection={onUpdateSelection}
        />
      ))}
    </div>
  );
}

function MessageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-zinc-500"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
