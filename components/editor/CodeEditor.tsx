'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
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

interface CodeEditorProps {
  onSelectionChange?: (selection: SelectionRange | null) => void;
}

export function CodeEditor({ onSelectionChange }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [lineCount, setLineCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { code, language, theme, setCode, setLanguage, setFileName } = useAppStore(
    useShallow((state) => ({
      code: state.editor.code,
      language: state.editor.language,
      theme: state.theme,
      setCode: state.setCode,
      setLanguage: state.setLanguage,
      setFileName: state.setFileName,
    }))
  );

  // Update line count when code changes
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
    setShowWarning(lines >= WARNING_THRESHOLD);
  }, [code]);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;

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

      // Configure language detection on initial content
      if (code) {
        const detected = detectLanguage('untitled', code);
        if (detected !== language && detected !== 'plaintext') {
          setLanguage(detected);
        }
      }
    },
    [code, language, setLanguage, onSelectionChange]
  );

  const handleChange: OnChange = useCallback(
    (value) => {
      const newCode = value || '';

      // Enforce line limit
      const lines = newCode.split('\n');
      if (lines.length > MAX_LINES) {
        const truncated = lines.slice(0, MAX_LINES).join('\n');
        setCode(truncated);
        return;
      }

      setCode(newCode);

      // Auto-detect language if it's still plaintext
      if (language === 'plaintext' && newCode.trim()) {
        const detected = detectLanguage('untitled', newCode);
        if (detected !== 'plaintext') {
          setLanguage(detected);
        }
      }
    },
    [language, setCode, setLanguage]
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

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Line count indicator */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-500">
        <span>
          {lineCount} / {MAX_LINES} lines
        </span>
        {showWarning && (
          <span className="text-yellow-500">Approaching line limit</span>
        )}
      </div>

      {/* Editor container */}
      <div className="relative flex-1">
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 border-2 border-dashed border-blue-500 rounded-lg">
            <div className="text-lg text-blue-400">Drop file to load</div>
          </div>
        )}

        {/* Placeholder when empty */}
        {!code && (
          <div className="absolute inset-0 z-5 flex items-center justify-center pointer-events-none">
            <div className="text-center text-zinc-600">
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
