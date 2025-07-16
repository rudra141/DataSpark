'use server';

/**
 * @fileOverview Refines a user's natural language description for formula generation to be more specific and detailed.
 *
 * - enhancePrompt - A function that refines the user's prompt.
 * - EnhancePromptInput - The input type for the enhancePrompt function.
 * - EnhancePromptOutput - The return type for the enhancePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePromptInputSchema = z.object({
  description: z.string().describe('The user\'s initial, natural language description of the desired calculation.'),
});
export type EnhancePromptInput = z.infer<typeof EnhancePromptInputSchema>;

const EnhancePromptOutputSchema = z.object({
  enhancedDescription: z.string().describe('The refined and more detailed description for the formula generation model.'),
});
export type EnhancePromptOutput = z.infer<typeof EnhancePromptOutputSchema>;

export async function enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput> {
  return enhancePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePrompt',
  input: {schema: EnhancePromptInputSchema},
  output: {schema: EnhancePromptOutputSchema},
  prompt: `You are an expert in transforming vague user requests into precise, detailed instructions for a formula generation AI.

Given the user's description, refine and expand it. The goal is to make it as unambiguous as possible for another AI that will generate Excel and Google Sheets formulas.

- Clarify cell references (e.g., 'column A' instead of 'the first column').
- Add specific conditions if they are implied (e.g., 'if column B is "Complete"' instead of 'when it's done').
- Structure the request logically.
- Do not invent new requirements, only clarify existing ones.
- The output should be a single, refined paragraph.

Original description: {{{description}}}
`,
});

const enhancePromptFlow = ai.defineFlow(
  {
    name: 'enhancePromptFlow',
    inputSchema: EnhancePromptInputSchema,
    outputSchema: EnhancePromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
