'use client';

import { useState, useCallback } from 'react';
import { CodeEditor, SelectionRange, ContextMenuEvent, ContextMenu, ThreadPanel } from '@/components';
import { useHydration, useAppStore } from '@/stores';
import { useReview } from '@/lib/ai';
import type { ReviewAction } from '@/types';

interface ContextMenuState {
  x: number;
  y: number;
  selection: SelectionRange;
}

export default function Home() {
  const hydrated = useHydration();
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const createThread = useAppStore((state) => state.createThread);
  const { startReview, isStreaming, activeMessageId } = useReview();

  const handleThreadClick = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const handleGutterClick = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const handleContextMenu = useCallback((event: ContextMenuEvent) => {
    setContextMenu({
      x: event.x,
      y: event.y,
      selection: event.selection,
    });
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuAction = useCallback(
    (action: ReviewAction, customPrompt?: string) => {
      if (!contextMenu) return;

      const threadId = createThread(
        contextMenu.selection.startLine,
        contextMenu.selection.endLine,
        action,
        customPrompt
      );

      // Set the new thread as active and scroll to it
      setActiveThreadId(threadId);
      setContextMenu(null);

      // Trigger AI review
      startReview({
        threadId,
        action,
        customPrompt,
        isFollowUp: false,
      });
    },
    [contextMenu, createThread, startReview]
  );

  // Show loading state during hydration to prevent mismatch
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      {/* Header placeholder - will be implemented in Phase 8 */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
        <h1 className="text-lg font-semibold text-zinc-100">AI Code Review</h1>
        {selection && (
          <span className="text-sm text-zinc-500">
            Lines {selection.startLine}-{selection.endLine} selected
          </span>
        )}
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <main className="flex-1 overflow-hidden">
          <CodeEditor
            onSelectionChange={setSelection}
            onGutterClick={handleGutterClick}
            onContextMenu={handleContextMenu}
          />
        </main>

        {/* Thread panel */}
        <aside className="hidden lg:block">
          <ThreadPanel
            onThreadClick={handleThreadClick}
            activeThreadId={activeThreadId}
            streamingMessageId={activeMessageId}
          />
        </aside>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleContextMenuAction}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
}
