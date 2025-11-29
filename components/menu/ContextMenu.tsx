'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReviewAction } from '@/types';

interface ContextMenuProps {
  x: number;
  y: number;
  onAction: (action: ReviewAction, customPrompt?: string) => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onAction, onClose }: ContextMenuProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position the menu ensuring it stays within viewport
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return { left: x, top: y };

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Adjust horizontal position if menu would overflow
    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 8;
    }

    // Adjust vertical position if menu would overflow
    if (y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 8;
    }

    return { left: Math.max(8, adjustedX), top: Math.max(8, adjustedY) };
  }, [x, y]);

  const [position, setPosition] = useState({ left: x, top: y });

  // Adjust position after menu renders
  useEffect(() => {
    const adjustPosition = () => {
      setPosition(getAdjustedPosition());
    };

    // Slight delay to allow menu to render
    requestAnimationFrame(adjustPosition);
  }, [getAdjustedPosition]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCustomInput) {
          setShowCustomInput(false);
          setCustomPrompt('');
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, showCustomInput]);

  // Focus input when custom prompt mode is shown
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleAction = useCallback((action: ReviewAction) => {
    onAction(action);
    onClose();
  }, [onAction, onClose]);

  const handleCustomClick = useCallback(() => {
    setShowCustomInput(true);
  }, []);

  const handleCustomSubmit = useCallback(() => {
    if (customPrompt.trim()) {
      onAction('custom', customPrompt.trim());
      onClose();
    }
  }, [customPrompt, onAction, onClose]);

  const handleCustomKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customPrompt.trim()) {
      e.preventDefault();
      handleCustomSubmit();
    }
  }, [customPrompt, handleCustomSubmit]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 rounded-md border border-zinc-700 bg-zinc-800 py-1 shadow-lg light:border-zinc-300 light:bg-white light:shadow-xl"
      style={{ left: position.left, top: position.top }}
    >
      {!showCustomInput ? (
        <>
          <button
            onClick={() => handleAction('explain')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            <LightbulbIcon />
            Explain
          </button>
          <button
            onClick={() => handleAction('bugs')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            <BugIcon />
            Find bugs
          </button>
          <button
            onClick={() => handleAction('improve')}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            <SparklesIcon />
            Improve
          </button>
          <div className="my-1 border-t border-zinc-700 light:border-zinc-200" />
          <button
            onClick={handleCustomClick}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            <ChatIcon />
            Custom...
          </button>
        </>
      ) : (
        <div className="px-2 py-1">
          <input
            ref={inputRef}
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Ask anything about this code..."
            className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none light:border-zinc-300 light:bg-zinc-50 light:text-zinc-900 light:placeholder:text-zinc-500"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCustomInput(false);
                setCustomPrompt('');
              }}
              className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 light:text-zinc-700 light:hover:bg-zinc-100 light:hover:text-zinc-900"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomSubmit}
              disabled={!customPrompt.trim()}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LightbulbIcon() {
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
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

function BugIcon() {
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
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
      <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
      <path d="M22 13h-4" />
      <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
    </svg>
  );
}

function SparklesIcon() {
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
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function ChatIcon() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
