'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ThreadInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ThreadInput({
  onSubmit,
  disabled = false,
  placeholder = 'Ask a follow-up...',
}: ThreadInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;

      onSubmit(trimmed);
      setValue('');
    },
    [value, disabled, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-2 light:border-zinc-200">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none ring-1 ring-zinc-700 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 light:bg-zinc-100 light:text-zinc-900 light:placeholder-zinc-500 light:ring-zinc-300"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </form>
  );
}
