import { ReviewAction, Message } from '@/types';

export const SYSTEM_PROMPT = `You are an expert code reviewer. Your role is to provide clear, helpful, and actionable feedback on code.

Guidelines:
- Be concise but thorough
- Focus on the most important issues first
- When suggesting code changes, wrap them in a markdown code block with the label "suggestion"
- Only provide suggestions for the selected code region
- If changes are needed outside the selection, use a special "outside" block to note them

For code suggestions within the selected region, use this format:
\`\`\`suggestion
// your suggested code here
\`\`\`

For notes about changes needed outside the selection (informational only), use:
\`\`\`outside
Brief note about what else might need to change and where
\`\`\`

You can provide multiple alternative suggestions if appropriate, each in its own suggestion block.`;

export function getActionPrompt(action: ReviewAction, customPrompt?: string): string {
  switch (action) {
    case 'explain':
      return 'Explain what this code does. Break down the logic step by step in a clear and concise way.';
    case 'bugs':
      return 'Analyze this code for potential bugs, issues, or edge cases. If you find issues, explain them and provide fix suggestions.';
    case 'improve':
      return 'Review this code and suggest improvements for readability, performance, or best practices. If the code looks good, say so and explain why.';
    case 'custom':
      return customPrompt || 'Review this code.';
    default:
      return 'Review this code.';
  }
}

export function buildUserMessage(
  selectedCode: string,
  fullCode: string,
  language: string,
  action: ReviewAction,
  customPrompt?: string,
  startLine?: number,
  endLine?: number
): string {
  const actionPrompt = getActionPrompt(action, customPrompt);
  const lineInfo = startLine && endLine ? ` (lines ${startLine}-${endLine})` : '';

  return `${actionPrompt}

**Selected Code${lineInfo}:**
\`\`\`${language}
${selectedCode}
\`\`\`

**Full File Context (${language}):**
\`\`\`${language}
${fullCode}
\`\`\``;
}

export function buildFollowUpMessage(content: string): string {
  return content;
}

export function formatThreadHistory(messages: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
