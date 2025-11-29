'use client';

import { useState, useCallback } from 'react';
import { CodeEditor, SelectionRange, ThreadPanel } from '@/components';
import { useHydration } from '@/stores';

export default function Home() {
  const hydrated = useHydration();
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const handleThreadClick = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const handleGutterClick = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
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
          />
        </main>

        {/* Thread panel */}
        <aside className="hidden lg:block">
          <ThreadPanel onThreadClick={handleThreadClick} />
        </aside>
      </div>
    </div>
  );
}
