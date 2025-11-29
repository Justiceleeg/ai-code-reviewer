'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores';
import { ThemeToggle } from './ThemeToggle';
import { SUPPORTED_LANGUAGES } from '@/lib/editor';

// Copy icon
function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// Export icon
function ExportIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Trash icon
function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// Check icon for copy confirmation
function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Chevron down icon for dropdown
function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface AppHeaderProps {
  onExport: () => void;
  onClearSession: () => void;
}

export function AppHeader({ onExport, onClearSession }: AppHeaderProps) {
  const fileName = useAppStore((state) => state.editor.fileName);
  const language = useAppStore((state) => state.editor.language);
  const code = useAppStore((state) => state.editor.code);
  const setFileName = useAppStore((state) => state.setFileName);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(fileName);
  const [copied, setCopied] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when filename changes externally
  useEffect(() => {
    setEditValue(fileName);
  }, [fileName]);

  // Close language menu when clicking outside
  useEffect(() => {
    if (!showLanguageMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(e.target as Node) &&
        languageButtonRef.current &&
        !languageButtonRef.current.contains(e.target as Node)
      ) {
        setShowLanguageMenu(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showLanguageMenu]);

  const handleStartEditing = useCallback(() => {
    setEditValue(fileName);
    setIsEditing(true);
  }, [fileName]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== fileName) {
      setFileName(trimmed);
    }
    setIsEditing(false);
  }, [editValue, fileName, setFileName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(fileName);
        setIsEditing(false);
      }
    },
    [handleSave, fileName]
  );

  const handleCopyCode = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  const handleSelectLanguage = useCallback(
    (langId: string) => {
      setLanguage(langId);
      setShowLanguageMenu(false);
    },
    [setLanguage]
  );

  // Get display label for current language
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.id === language)?.label || language;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4 light:border-zinc-300 light:bg-white">
      {/* Left side: Title and file info */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-zinc-100 light:text-zinc-900">
          AI Code Review
        </h1>

        <div className="flex items-center gap-2">
          {/* Editable filename */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none focus:border-blue-500 light:border-zinc-300 light:bg-zinc-50 light:text-zinc-900"
            />
          ) : (
            <button
              onClick={handleStartEditing}
              className="rounded px-2 py-0.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 light:text-zinc-700 light:hover:bg-zinc-100 light:hover:text-zinc-900"
              title="Click to edit filename"
            >
              {fileName}
            </button>
          )}

          {/* Language selector */}
          <div className="relative">
            <button
              ref={languageButtonRef}
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 light:bg-zinc-100 light:text-zinc-800 light:hover:bg-zinc-200"
              title="Click to change language"
            >
              {currentLanguageLabel}
              <ChevronDownIcon />
            </button>

            {showLanguageMenu && (
              <div
                ref={languageMenuRef}
                className="absolute left-0 top-full z-50 mt-1 max-h-64 w-40 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-lg light:border-zinc-300 light:bg-white"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleSelectLanguage(lang.id)}
                    className={`flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-zinc-700 light:hover:bg-zinc-100 ${
                      lang.id === language
                        ? 'text-blue-400 light:text-blue-600'
                        : 'text-zinc-300 light:text-zinc-800'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Copy code button */}
        <button
          onClick={handleCopyCode}
          disabled={!code}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 light:text-zinc-700 light:hover:bg-zinc-100 light:hover:text-zinc-900"
          title="Copy code to clipboard"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* Export button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 light:text-zinc-700 light:hover:bg-zinc-100 light:hover:text-zinc-900"
          title="Export threads as Markdown"
        >
          <ExportIcon />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Clear session button */}
        <button
          onClick={onClearSession}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-red-900/50 hover:text-red-400 light:text-zinc-700 light:hover:bg-red-50 light:hover:text-red-600"
          title="Clear session"
        >
          <TrashIcon />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </header>
  );
}
