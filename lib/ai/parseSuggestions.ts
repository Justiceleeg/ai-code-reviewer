import { CodeSuggestion } from '@/types';

/**
 * Result of parsing AI response for suggestions and notes
 */
export interface ParsedResponse {
  suggestions: CodeSuggestion[];
  outsideNotes: string[];
}

/**
 * Parses code suggestions from AI response text.
 * Looks for markdown code blocks with the "suggestion" label.
 *
 * Example format:
 * ```suggestion
 * const result = data.map(item => item.value);
 * ```
 */
export function parseSuggestions(
  responseText: string,
  originalCode: string
): CodeSuggestion[] {
  const suggestions: CodeSuggestion[] = [];

  // Match code blocks with "suggestion" label
  // Supports: ```suggestion, ```suggestion:typescript, etc.
  const suggestionRegex = /```suggestion(?::\w+)?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = suggestionRegex.exec(responseText)) !== null) {
    const suggestedCode = match[1].trim();

    if (suggestedCode) {
      suggestions.push({
        id: `suggestion-${index}`,
        original: originalCode,
        suggested: suggestedCode,
        applied: false,
      });
      index++;
    }
  }

  return suggestions;
}

/**
 * Parses notes about changes needed outside the selection.
 * Looks for markdown code blocks with the "outside" label.
 *
 * Example format:
 * ```outside
 * You may also need to update the import at line 1
 * ```
 */
export function parseOutsideNotes(responseText: string): string[] {
  const notes: string[] = [];

  // Match code blocks with "outside" label
  const outsideRegex = /```outside\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;

  while ((match = outsideRegex.exec(responseText)) !== null) {
    const note = match[1].trim();
    if (note) {
      notes.push(note);
    }
  }

  return notes;
}

/**
 * Parses both suggestions and outside notes from AI response.
 */
export function parseResponse(
  responseText: string,
  originalCode: string
): ParsedResponse {
  return {
    suggestions: parseSuggestions(responseText, originalCode),
    outsideNotes: parseOutsideNotes(responseText),
  };
}

/**
 * Checks if a response contains any code suggestions.
 */
export function hasSuggestions(responseText: string): boolean {
  return /```suggestion(?::\w+)?\n/.test(responseText);
}
