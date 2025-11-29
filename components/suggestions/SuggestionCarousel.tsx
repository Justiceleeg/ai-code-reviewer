'use client';

import { useState, useCallback } from 'react';
import { DiffView } from './DiffView';
import { useAppStore } from '@/stores';
import type { CodeSuggestion } from '@/types';

interface SuggestionCarouselProps {
  suggestions: CodeSuggestion[];
  threadId: string;
  messageId: string;
}

export function SuggestionCarousel({
  suggestions,
  threadId,
  messageId,
}: SuggestionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const applySuggestion = useAppStore((state) => state.applySuggestion);

  const currentSuggestion = suggestions[currentIndex];
  const total = suggestions.length;
  const hasMultiple = total > 1;

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const handleApply = useCallback(() => {
    applySuggestion(threadId, messageId, currentSuggestion.id);
  }, [applySuggestion, threadId, messageId, currentSuggestion.id]);

  if (!currentSuggestion) {
    return null;
  }

  const isApplied = currentSuggestion.applied;

  return (
    <div className="mt-3 space-y-2">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">
          Code Suggestion
          {hasMultiple && (
            <span className="ml-1 text-zinc-500">
              ({currentIndex + 1} of {total})
            </span>
          )}
        </span>

        {hasMultiple && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Previous suggestion"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={handleNext}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Next suggestion"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* Diff view */}
      <DiffView
        original={currentSuggestion.original}
        suggested={currentSuggestion.suggested}
      />

      {/* Apply button */}
      <div className="flex items-center justify-end gap-2">
        {isApplied ? (
          <span className="flex items-center gap-1 text-xs text-emerald-500">
            <CheckIcon />
            Applied
          </span>
        ) : (
          <button
            onClick={handleApply}
            className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <ApplyIcon />
            Apply
          </button>
        )}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <path d="m9 18 6-6-6-6" />
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
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ApplyIcon() {
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
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}
