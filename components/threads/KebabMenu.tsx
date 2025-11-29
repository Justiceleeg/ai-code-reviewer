'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface KebabMenuProps {
  onResolve: () => void;
  onDelete: () => void;
  onUpdateSelection?: () => void;
  showUpdateSelection?: boolean;
  disabled?: boolean;
}

export function KebabMenu({
  onResolve,
  onDelete,
  onUpdateSelection,
  showUpdateSelection = false,
  disabled = false,
}: KebabMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleResolve = useCallback(() => {
    onResolve();
    setIsOpen(false);
  }, [onResolve]);

  const handleUpdateSelection = useCallback(() => {
    onUpdateSelection?.();
    setIsOpen(false);
  }, [onUpdateSelection]);

  const handleDelete = useCallback(() => {
    onDelete();
    setIsOpen(false);
  }, [onDelete]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 light:text-zinc-500 light:hover:bg-zinc-200 light:hover:text-zinc-900"
        aria-label="Thread options"
      >
        <KebabIcon />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-lg light:border-zinc-300 light:bg-white"
        >
          {showUpdateSelection && onUpdateSelection && (
            <button
              onClick={handleUpdateSelection}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
            >
              <RefreshIcon />
              Update Selection
            </button>
          )}
          <button
            onClick={handleResolve}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            <CheckIcon />
            Resolve
          </button>
          <div className="my-1 border-t border-zinc-700 light:border-zinc-200" />
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-400 hover:bg-zinc-700 light:text-red-500 light:hover:bg-red-50"
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function KebabIcon() {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function CheckIcon() {
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
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RefreshIcon() {
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
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function TrashIcon() {
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
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
