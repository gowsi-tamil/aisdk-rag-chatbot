import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  InferUITools,
  UIDataTypes,
  stepCountIs,
} from 'ai';

import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { searchDocuments } from '@/lib/search';

const tools = {
  searchKnowledgeBase: tool({
    description:
      "Search uploaded PDF documents for information relevant to the user's question.",

    inputSchema: z.object({
      query: z.string().describe('The search query to find relevant documents'),
    }),

    execute: async ({ query }) => {
      try {
        const results = await searchDocuments(query, 3, 0.5);

        if (!results.length) {
          return 'No relevant information found in the knowledge base.';
        }

        return results
          .map((result, index) => `[Source ${index + 1}]\n${result.content}`)
          .join('\n\n');
      } catch (error) {
        console.error('Knowledge base search error:', error);

        return 'Unable to search the knowledge base right now.';
      }
    },
  }),
};

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    const result = streamText({
      model: google('gemini-3.5-flash-lite'),
      messages: convertToModelMessages(messages),

      tools,

      system: `
        You are a helpful AI assistant connected to a document knowledge base.

        Instructions:
        1. Answer users in simple and clear language.
        2. Use searchKnowledgeBase when questions relate to uploaded documents.
        3. Base document-related answers on retrieved information.
        4. Never invent information from documents.
        5. If no relevant information is found, clearly mention it.
        6. Provide concise and structured answers.
        7. Mention relevant sources whenever possible.
      `,

      stopWhen: stepCountIs(3),

      maxRetries: 1,

      onError({ error }) {
        console.error('Gemini generation error:', error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('Chat stream error:', error);

        return 'Gemini is temporarily unavailable. Please try again.';
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return new Response('Failed to process chat request.', {
      status: 500,
    });
  }
}
