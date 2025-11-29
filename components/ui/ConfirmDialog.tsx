'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  if (!isOpen) return null;

  const confirmButtonStyles =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div
        ref={dialogRef}
        className="mx-4 w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl light:border-zinc-300 light:bg-white"
      >
        <h2
          id="dialog-title"
          className="mb-2 text-lg font-semibold text-zinc-100 light:text-zinc-900"
        >
          {title}
        </h2>
        <p
          id="dialog-description"
          className="mb-6 text-sm text-zinc-400 light:text-zinc-700"
        >
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 light:text-zinc-800 light:hover:bg-zinc-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${confirmButtonStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
