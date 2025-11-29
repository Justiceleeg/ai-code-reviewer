import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { SYSTEM_PROMPT, buildUserMessage, formatThreadHistory } from '@/lib/ai';
import { ReviewAction, Message } from '@/types';

export const maxDuration = 60;

interface ReviewRequest {
  selectedCode: string;
  fullCode: string;
  language: string;
  action: ReviewAction;
  customPrompt?: string;
  startLine?: number;
  endLine?: number;
  threadHistory?: Message[];
}

export async function POST(req: Request) {
  try {
    const body: ReviewRequest = await req.json();
    const {
      selectedCode,
      fullCode,
      language,
      action,
      customPrompt,
      startLine,
      endLine,
      threadHistory,
    } = body;

    if (!selectedCode || !fullCode || !language || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (threadHistory && threadHistory.length > 0) {
      messages.push(...formatThreadHistory(threadHistory));
    } else {
      const userMessage = buildUserMessage(
        selectedCode,
        fullCode,
        language,
        action,
        customPrompt,
        startLine,
        endLine
      );
      messages.push({ role: 'user', content: userMessage });
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: SYSTEM_PROMPT,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Review API error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
