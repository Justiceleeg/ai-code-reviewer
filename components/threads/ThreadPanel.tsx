'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ThreadList } from './ThreadList';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

interface ThreadPanelProps {
  onThreadClick?: (threadId: string) => void;
  activeThreadId?: string | null;
  streamingMessageId?: string | null;
}

export function ThreadPanel({ onThreadClick, activeThreadId, streamingMessageId }: ThreadPanelProps) {
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const saved = localStorage.getItem('thread-panel-width');
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Save width preference to localStorage
  useEffect(() => {
    if (!isCollapsed) {
      localStorage.setItem('thread-panel-width', width.toString());
    }
  }, [width, isCollapsed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate width from right edge (panel is on right side)
      const newWidth = containerRect.right - e.clientX;
      const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  if (isCollapsed) {
    return (
      <div
        ref={panelRef}
        className="flex h-full w-10 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950"
      >
        <button
          onClick={toggleCollapsed}
          className="flex h-10 w-full items-center justify-center border-b border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          aria-label="Expand thread panel"
        >
          <ChevronLeftIcon />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <span
            className="text-xs text-zinc-600"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Threads
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="relative flex h-full shrink-0 flex-col border-l border-zinc-800 bg-zinc-950"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className={`absolute left-0 top-0 h-full w-1 cursor-col-resize transition-colors ${
          isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-zinc-700'
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
        <h2 className="text-sm font-medium text-zinc-300">Threads</h2>
        <button
          onClick={toggleCollapsed}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          aria-label="Collapse thread panel"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        <ThreadList
          onThreadClick={onThreadClick}
          activeThreadId={activeThreadId}
          streamingMessageId={streamingMessageId}
        />
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
