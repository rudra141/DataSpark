
'use server';

/**
 * @fileOverview Enables conversational querying of CSV data.
 *
 * - chatWithData - A function that answers questions about CSV data.
 * - ChatWithDataInput - The input type for the chatWithData function.
 * - ChatWithDataOutput - The return type for the chatWithData function.
 * - ChatMessage - A type for a single message in the chat history.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const ChatWithDataInputSchema = z.object({
  csvData: z.string().describe('The full content of the CSV file as a single string.'),
  question: z.string().describe("The user's question about the data."),
  history: z.array(ChatMessageSchema).optional().describe('The conversation history to provide context.'),
});
export type ChatWithDataInput = z.infer<typeof ChatWithDataInputSchema>;

const ChatWithDataOutputSchema = z.object({
  answer: z.string().describe("The AI model's answer to the user's question."),
});
export type ChatWithDataOutput = z.infer<typeof ChatWithDataOutputSchema>;

export async function chatWithData(input: ChatWithDataInput): Promise<ChatWithDataOutput> {
  return chatWithDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithDataPrompt',
  input: {schema: ChatWithDataInputSchema},
  output: {schema: ChatWithDataOutputSchema},
  prompt: `You are an expert data analyst. The user has uploaded a CSV file and is asking questions about it.
Your answers must be based *only* on the data provided in the CSV content. Do not make up information.
If the question cannot be answered from the data, say so. Keep your answers concise and to the point.

Here is the conversation history for context (if any):
{{#if history}}
{{#each history}}
{{#if (eq this.role "user")}}User: {{{this.content}}}{{/if}}
{{#if (eq this.role "model")}}Assistant: {{{this.content}}}{{/if}}
{{/each}}
{{/if}}

Here is the full CSV data:
\`\`\`csv
{{{csvData}}}
\`\`\`

Here is the user's new question:
"{{{question}}}"

Provide your answer based on the CSV data and the conversation history.
`,
});

const chatWithDataFlow = ai.defineFlow(
  {
    name: 'chatWithDataFlow',
    inputSchema: ChatWithDataInputSchema,
    outputSchema: ChatWithDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
