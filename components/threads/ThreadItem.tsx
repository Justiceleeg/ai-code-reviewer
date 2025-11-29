'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores';
import { useReview } from '@/lib/ai';
import type { Thread } from '@/types';
import { ThreadMessage } from './ThreadMessage';
import { ThreadInput } from './ThreadInput';
import { KebabMenu } from './KebabMenu';

interface ThreadItemProps {
  thread: Thread;
  isActive?: boolean;
  onClick?: () => void;
  streamingMessageId?: string | null;
  onUpdateSelection?: (threadId: string, startLine: number, endLine: number) => void;
}

export function ThreadItem({
  thread,
  isActive = false,
  onClick,
  streamingMessageId,
  onUpdateSelection,
}: ThreadItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-expand and scroll when this thread becomes active
  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
      // Scroll to this thread after a short delay to allow expansion
      setTimeout(() => {
        threadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [isActive]);

  const resolveThread = useAppStore((state) => state.resolveThread);
  const deleteThread = useAppStore((state) => state.deleteThread);
  const addMessage = useAppStore((state) => state.addMessage);
  const { startReview, isStreaming } = useReview();

  const isOutdated = thread.status === 'outdated';
  const isResolved = thread.status === 'resolved';
  const messageCount = thread.messages.length;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isExpanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isExpanded, thread.messages.length]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    onClick?.();
  }, [onClick]);

  const handleResolve = useCallback(() => {
    resolveThread(thread.id);
  }, [resolveThread, thread.id]);

  const handleDelete = useCallback(() => {
    deleteThread(thread.id);
  }, [deleteThread, thread.id]);

  const handleUpdateSelection = useCallback(() => {
    onUpdateSelection?.(thread.id, thread.startLine, thread.endLine);
  }, [onUpdateSelection, thread.id, thread.startLine, thread.endLine]);

  const handleFollowUp = useCallback(
    (message: string) => {
      addMessage(thread.id, {
        role: 'user',
        content: message,
      });

      // Trigger AI response for follow-up
      startReview({
        threadId: thread.id,
        action: 'custom',
        customPrompt: message,
        isFollowUp: true,
      });
    },
    [addMessage, thread.id, startReview]
  );

  // Collapsed view
  if (!isExpanded) {
    return (
      <div
        ref={threadRef}
        className={`cursor-pointer p-3 transition-colors hover:bg-zinc-900 light:hover:bg-zinc-100 ${
          isResolved ? 'opacity-60' : ''
        }`}
        onClick={handleToggle}
      >
        {/* Outdated banner */}
        {isOutdated && (
          <div className="mb-2 rounded bg-yellow-500/10 px-2 py-1 text-xs text-yellow-500 light:text-yellow-600">
            Code has changed - selection may be outdated
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <StatusIndicator status={thread.status} />

            {/* Line range */}
            <span className="text-sm text-zinc-300 light:text-zinc-900">
              {thread.startLine === thread.endLine
                ? `Line ${thread.startLine}`
                : `Lines ${thread.startLine}-${thread.endLine}`}
            </span>
          </div>

          {/* Message count */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 light:text-zinc-500">
              {messageCount} message{messageCount !== 1 ? 's' : ''}
            </span>
            <ChevronDownIcon />
          </div>
        </div>

        {/* Preview of last message */}
        {thread.messages.length > 0 && (
          <p className="mt-1 truncate text-xs text-zinc-500 light:text-zinc-600">
            {thread.messages[thread.messages.length - 1].content.slice(0, 60)}
            {thread.messages[thread.messages.length - 1].content.length > 60 ? '...' : ''}
          </p>
        )}
      </div>
    );
  }

  // Expanded view
  return (
    <div ref={threadRef} className={`border-b border-zinc-800 light:border-zinc-200 ${isResolved ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between bg-zinc-900/50 p-3 light:bg-zinc-100/50"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <StatusIndicator status={thread.status} />
          <span className="text-sm font-medium text-zinc-300 light:text-zinc-900">
            {thread.startLine === thread.endLine
              ? `Line ${thread.startLine}`
              : `Lines ${thread.startLine}-${thread.endLine}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isResolved && (
            <div onClick={(e) => e.stopPropagation()}>
              <KebabMenu
                onResolve={handleResolve}
                onDelete={handleDelete}
                onUpdateSelection={handleUpdateSelection}
                showUpdateSelection={isOutdated}
              />
            </div>
          )}
          <button className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 light:text-zinc-500 light:hover:bg-zinc-200 light:hover:text-zinc-900">
            <ChevronUpIcon />
          </button>
        </div>
      </div>

      {/* Outdated banner (expanded) */}
      {isOutdated && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-500 light:text-yellow-600">
          <div className="flex items-center justify-between">
            <span>Code at this location has changed</span>
            <button
              onClick={handleUpdateSelection}
              className="rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-medium hover:bg-yellow-500/30"
            >
              Update Selection
            </button>
          </div>
        </div>
      )}

      {/* Resolved banner */}
      {isResolved && (
        <div className="border-b border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-500 light:border-zinc-300 light:bg-zinc-200/50 light:text-zinc-600">
          This thread has been resolved
        </div>
      )}

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto">
        {thread.messages.map((message) => (
          <ThreadMessage
            key={message.id}
            message={message}
            threadId={thread.id}
            isStreaming={streamingMessageId === message.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input for follow-up (not shown for resolved threads) */}
      {!isResolved && (
        <ThreadInput
          onSubmit={handleFollowUp}
          placeholder="Ask a follow-up question..."
          disabled={isStreaming}
        />
      )}
    </div>
  );
}

interface StatusIndicatorProps {
  status: Thread['status'];
}

function StatusIndicator({ status }: StatusIndicatorProps) {
  const colors = {
    active: 'bg-emerald-500',
    outdated: 'bg-yellow-500',
    resolved: 'bg-zinc-500',
  };

  return (
    <span
      className={`h-2 w-2 rounded-full ${colors[status]}`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}

function ChevronDownIcon() {
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
      className="text-zinc-500"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ChevronUpIcon() {
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
      className="text-zinc-500"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
