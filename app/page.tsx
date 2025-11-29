'use client';

import { useState, useCallback } from 'react';
import {
  CodeEditor,
  SelectionRange,
  SelectionModeState,
  ContextMenuEvent,
  ContextMenu,
  ThreadPanel,
  AppHeader,
  ConfirmDialog,
} from '@/components';
import { useHydration, useAppStore } from '@/stores';
import { useReview } from '@/lib/ai';
import { exportToMarkdown, downloadMarkdown } from '@/lib/export';
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionModeState | null>(null);

  const createThread = useAppStore((state) => state.createThread);
  const clearSession = useAppStore((state) => state.clearSession);
  const updateThreadSelection = useAppStore((state) => state.updateThreadSelection);
  const fileName = useAppStore((state) => state.editor.fileName);
  const language = useAppStore((state) => state.editor.language);
  const threads = useAppStore((state) => state.threads);
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

  const handleExport = useCallback(() => {
    const markdown = exportToMarkdown({ fileName, language, threads });
    downloadMarkdown(markdown, fileName);
  }, [fileName, language, threads]);

  const handleClearSession = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const handleConfirmClear = useCallback(() => {
    clearSession();
    setActiveThreadId(null);
    setSelection(null);
    setShowClearConfirm(false);
  }, [clearSession]);

  const handleCancelClear = useCallback(() => {
    setShowClearConfirm(false);
  }, []);

  // Selection mode handlers
  const handleEnterSelectionMode = useCallback(
    (threadId: string, startLine: number, endLine: number) => {
      setSelectionMode({
        threadId,
        originalRange: { startLine, endLine },
      });
    },
    []
  );

  const handleSelectionModeConfirm = useCallback(
    (threadId: string, newRange: SelectionRange) => {
      updateThreadSelection(threadId, newRange.startLine, newRange.endLine);
      setSelectionMode(null);
    },
    [updateThreadSelection]
  );

  const handleSelectionModeCancel = useCallback(() => {
    setSelectionMode(null);
  }, []);

  // Show loading state during hydration to prevent mismatch
  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 light:bg-zinc-50">
      <AppHeader onExport={handleExport} onClearSession={handleClearSession} />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <main className="flex-1 overflow-hidden">
          <CodeEditor
            onSelectionChange={setSelection}
            onGutterClick={handleGutterClick}
            onContextMenu={handleContextMenu}
            selectionMode={selectionMode}
            onSelectionModeConfirm={handleSelectionModeConfirm}
            onSelectionModeCancel={handleSelectionModeCancel}
          />
        </main>

        {/* Thread panel */}
        <aside className="hidden lg:block">
          <ThreadPanel
            onThreadClick={handleThreadClick}
            activeThreadId={activeThreadId}
            streamingMessageId={activeMessageId}
            onUpdateSelection={handleEnterSelectionMode}
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

      {/* Clear session confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Session"
        message="Are you sure you want to clear this session? All code and review threads will be permanently deleted."
        confirmLabel="Clear Session"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
      />
    </div>
  );
}
