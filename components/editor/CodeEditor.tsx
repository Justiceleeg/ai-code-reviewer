'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Editor, { OnMount, OnChange, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores';
import { detectLanguage, detectLanguageFromExtension } from '@/lib/editor';

const MAX_LINES = 1000;
const WARNING_THRESHOLD = 900;

export interface SelectionRange {
  startLine: number;
  endLine: number;
}

export interface ContextMenuEvent {
  x: number;
  y: number;
  selection: SelectionRange;
}

export interface SelectionModeState {
  threadId: string;
  originalRange: SelectionRange;
}

interface CodeEditorProps {
  onSelectionChange?: (selection: SelectionRange | null) => void;
  onGutterClick?: (threadId: string) => void;
  onContextMenu?: (event: ContextMenuEvent) => void;
  selectionMode?: SelectionModeState | null;
  onSelectionModeConfirm?: (threadId: string, newRange: SelectionRange) => void;
  onSelectionModeCancel?: () => void;
}

export function CodeEditor({
  onSelectionChange,
  onGutterClick,
  onContextMenu,
  selectionMode,
  onSelectionModeConfirm,
  onSelectionModeCancel,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const selectionModeDecorationsRef = useRef<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { code, language, theme, threads, setCode, setLanguage, setFileName } = useAppStore(
    useShallow((state) => ({
      code: state.editor.code,
      language: state.editor.language,
      theme: state.theme,
      threads: state.threads,
      setCode: state.setCode,
      setLanguage: state.setLanguage,
      setFileName: state.setFileName,
    }))
  );

  // Compute line count and warning from code
  const lineCount = useMemo(() => code.split('\n').length, [code]);
  const showWarning = lineCount >= WARNING_THRESHOLD;

  // Update gutter decorations when threads change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    // Create decorations for each thread
    const newDecorations: editor.IModelDeltaDecoration[] = threads.map((thread) => {
      const glyphClass =
        thread.status === 'active'
          ? 'thread-glyph-active'
          : thread.status === 'outdated'
            ? 'thread-glyph-outdated'
            : 'thread-glyph-resolved';

      const lineClass =
        thread.status === 'active'
          ? 'thread-line-active'
          : thread.status === 'outdated'
            ? 'thread-line-outdated'
            : 'thread-line-resolved';

      return {
        range: new monaco.Range(thread.startLine, 1, thread.endLine, 1),
        options: {
          isWholeLine: true,
          glyphMarginClassName: glyphClass,
          className: lineClass,
          glyphMarginHoverMessage: {
            value: `Thread: Lines ${thread.startLine}-${thread.endLine} (${thread.status})`,
          },
        },
      };
    });

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [threads]);

  // Handle selection mode decorations
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (selectionMode) {
      // Highlight the original (stale) selection with a special style
      const { startLine, endLine } = selectionMode.originalRange;
      const selectionModeDecorations: editor.IModelDeltaDecoration[] = [
        {
          range: new monaco.Range(startLine, 1, endLine, 1),
          options: {
            isWholeLine: true,
            className: 'selection-mode-highlight',
          },
        },
      ];
      selectionModeDecorationsRef.current = editor.deltaDecorations(
        selectionModeDecorationsRef.current,
        selectionModeDecorations
      );

      // Scroll to the original selection
      editor.revealLineInCenter(startLine);
    } else {
      // Clear selection mode decorations
      selectionModeDecorationsRef.current = editor.deltaDecorations(
        selectionModeDecorationsRef.current,
        []
      );
    }
  }, [selectionMode]);

  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Add custom CSS for gutter markers
      const styleEl = document.getElementById('thread-gutter-styles') || document.createElement('style');
      styleEl.id = 'thread-gutter-styles';
      styleEl.textContent = `
        .thread-glyph-active {
          background-color: #10b981;
          border-radius: 50%;
          margin-left: 5px;
          width: 8px !important;
          height: 8px !important;
          margin-top: 6px;
        }
        .thread-glyph-outdated {
          background-color: #eab308;
          border-radius: 50%;
          margin-left: 5px;
          width: 8px !important;
          height: 8px !important;
          margin-top: 6px;
        }
        .thread-glyph-resolved {
          background-color: #71717a;
          border-radius: 50%;
          margin-left: 5px;
          width: 8px !important;
          height: 8px !important;
          margin-top: 6px;
        }
        .thread-line-active {
          background-color: rgba(16, 185, 129, 0.1);
        }
        .thread-line-outdated {
          background-color: rgba(234, 179, 8, 0.1);
        }
        .thread-line-resolved {
          background-color: rgba(113, 113, 122, 0.05);
        }
        .selection-mode-highlight {
          background-color: rgba(234, 179, 8, 0.2);
          border-left: 3px solid #eab308;
        }
      `;
      if (!document.getElementById('thread-gutter-styles')) {
        document.head.appendChild(styleEl);
      }

      // Gutter click handler
      editor.onMouseDown((e) => {
        if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
          const lineNumber = e.target.position?.lineNumber;
          if (lineNumber) {
            // Find thread at this line
            const thread = threads.find(
              (t) => lineNumber >= t.startLine && lineNumber <= t.endLine
            );
            if (thread) {
              onGutterClick?.(thread.id);
            }
          }
        }
      });

      // Selection change listener
      editor.onDidChangeCursorSelection((e) => {
        const selection = e.selection;

        if (selection.isEmpty()) {
          onSelectionChange?.(null);
          return;
        }

        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;

        onSelectionChange?.({ startLine, endLine });
      });

      // Context menu handler (right-click)
      editor.onContextMenu((e) => {
        e.event.preventDefault();
        e.event.stopPropagation();

        const selection = editor.getSelection();
        if (!selection || selection.isEmpty()) {
          return; // No selection, don't show context menu
        }

        const startLine = selection.startLineNumber;
        const endLine = selection.endLineNumber;

        onContextMenu?.({
          x: e.event.posx,
          y: e.event.posy,
          selection: { startLine, endLine },
        });
      });

      // Configure language detection on initial content
      if (code) {
        const detected = detectLanguage('untitled', code);
        if (detected !== language && detected !== 'plaintext') {
          setLanguage(detected);
        }
      }
    },
    [code, language, threads, setLanguage, onSelectionChange, onGutterClick, onContextMenu]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      const newCode = value || '';
      const previousCode = code;

      // Enforce line limit
      const lines = newCode.split('\n');
      if (lines.length > MAX_LINES) {
        const truncated = lines.slice(0, MAX_LINES).join('\n');
        setCode(truncated);
        return;
      }

      setCode(newCode);

      // Auto-detect language when:
      // 1. Pasting into empty editor (previous was empty/whitespace, now has content)
      // 2. Language is still plaintext
      const wasEmpty = !previousCode.trim();
      const hasContent = newCode.trim().length > 0;
      const shouldDetect = (wasEmpty && hasContent) || language === 'plaintext';

      if (shouldDetect && hasContent) {
        const detected = detectLanguage('untitled', newCode);
        if (detected !== 'plaintext') {
          setLanguage(detected);
        }
      }
    },
    [code, language, setCode, setLanguage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const file = files[0];

      // Read file content
      const text = await file.text();

      // Enforce line limit
      const lines = text.split('\n');
      const content = lines.length > MAX_LINES ? lines.slice(0, MAX_LINES).join('\n') : text;

      setCode(content);
      setFileName(file.name);

      // Detect language from file extension
      const detected = detectLanguageFromExtension(file.name);
      if (detected) {
        setLanguage(detected);
      } else {
        // Fall back to content detection
        const fromContent = detectLanguage(file.name, content);
        setLanguage(fromContent);
      }
    },
    [setCode, setFileName, setLanguage]
  );

  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  // Handle selection mode confirm
  const handleSelectionModeConfirm = useCallback(() => {
    if (!selectionMode || !editorRef.current) return;

    const editor = editorRef.current;
    const selection = editor.getSelection();

    if (!selection || selection.isEmpty()) {
      // No selection, use original range
      onSelectionModeConfirm?.(selectionMode.threadId, selectionMode.originalRange);
    } else {
      const newRange: SelectionRange = {
        startLine: selection.startLineNumber,
        endLine: selection.endLineNumber,
      };
      onSelectionModeConfirm?.(selectionMode.threadId, newRange);
    }
  }, [selectionMode, onSelectionModeConfirm]);

  // Handle selection mode cancel
  const handleSelectionModeCancel = useCallback(() => {
    onSelectionModeCancel?.();
  }, [onSelectionModeCancel]);

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Selection mode banner */}
      {selectionMode && (
        <div className="flex items-center justify-between border-b border-yellow-500/50 bg-yellow-500/10 px-3 py-2">
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <span className="font-medium">Selection Mode:</span>
            <span>
              Select new line range for thread (Lines {selectionMode.originalRange.startLine}-
              {selectionMode.originalRange.endLine})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectionModeCancel}
              className="rounded px-3 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectionModeConfirm}
              className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-yellow-400"
            >
              Apply Selection
            </button>
          </div>
        </div>
      )}

      {/* Line count indicator */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 light:border-zinc-200 light:text-zinc-600">
        <span>
          {lineCount} / {MAX_LINES} lines
        </span>
        {showWarning && (
          <span className="text-yellow-500 light:text-yellow-600">Approaching line limit</span>
        )}
      </div>

      {/* Editor container */}
      <div className="relative flex-1">
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 border-2 border-dashed border-blue-500 rounded-lg light:bg-zinc-100/90">
            <div className="text-lg text-blue-400 light:text-blue-600">Drop file to load</div>
          </div>
        )}

        {/* Placeholder when empty */}
        {!code && (
          <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
            <div className="text-center text-zinc-600 light:text-zinc-500">
              <p className="text-lg">Paste or drag code here</p>
              <p className="mt-1 text-sm">Supports all major languages</p>
            </div>
          </div>
        )}

        <Editor
          height="100%"
          language={language}
          value={code}
          theme={monacoTheme}
          onMount={handleEditorMount}
          onChange={handleChange}
          options={{
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            folding: true,
            glyphMargin: true,
            contextmenu: false, // We'll use our own context menu
          }}
        />
      </div>
    </div>
  );
}
