'use client';

import { DiffEditor } from '@monaco-editor/react';
import { useAppStore } from '@/stores';
import { useShallow } from 'zustand/react/shallow';

interface DiffViewProps {
  original: string;
  suggested: string;
  language?: string;
}

export function DiffView({ original, suggested, language }: DiffViewProps) {
  const { theme, editorLanguage } = useAppStore(
    useShallow((state) => ({
      theme: state.theme,
      editorLanguage: state.editor.language,
    }))
  );

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';
  const displayLanguage = language || editorLanguage || 'plaintext';

  // Calculate height based on content lines (capped)
  const maxLines = Math.max(original.split('\n').length, suggested.split('\n').length);
  const height = Math.min(Math.max(maxLines * 20 + 20, 80), 300);

  return (
    <div className="overflow-hidden rounded border border-zinc-700">
      <DiffEditor
        height={height}
        language={displayLanguage}
        original={original}
        modified={suggested}
        theme={monacoTheme}
        options={{
          readOnly: true,
          renderSideBySide: false, // Inline mode
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'off',
          folding: false,
          wordWrap: 'on',
          fontSize: 12,
          padding: { top: 8, bottom: 8 },
          renderOverviewRuler: false,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'hidden',
            verticalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
