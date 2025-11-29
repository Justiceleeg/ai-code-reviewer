import { CodeSuggestion } from '@/types';

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
 * Checks if a response contains any code suggestions.
 */
export function hasSuggestions(responseText: string): boolean {
  return /```suggestion(?::\w+)?\n/.test(responseText);
}
