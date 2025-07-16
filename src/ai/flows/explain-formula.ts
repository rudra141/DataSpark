'use server';

/**
 * @fileOverview Generates a step-by-step explanation of how a given formula works.
 *
 * - explainFormula - A function that generates the explanation.
 * - ExplainFormulaInput - The input type for the explainFormula function.
 * - ExplainFormulaOutput - The return type for the explainFormula function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainFormulaInputSchema = z.object({
  formula: z.string().describe('The formula to explain.'),
  formulaType: z.enum(['Excel', 'Google Sheets']).describe('The type of formula (Excel or Google Sheets).'),
});
export type ExplainFormulaInput = z.infer<typeof ExplainFormulaInputSchema>;

const ExplainFormulaOutputSchema = z.object({
  explanation: z.string().describe('A step-by-step explanation of how the formula works.'),
});
export type ExplainFormulaOutput = z.infer<typeof ExplainFormulaOutputSchema>;

export async function explainFormula(input: ExplainFormulaInput): Promise<ExplainFormulaOutput> {
  return explainFormulaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainFormulaPrompt',
  input: {schema: ExplainFormulaInputSchema},
  output: {schema: ExplainFormulaOutputSchema},
  prompt: `You are an expert in both Excel and Google Sheets formulas.  Given a formula and its type (Excel or Google Sheets), provide a clear, step-by-step explanation of how the formula works.  The explanation should be easy to understand for users with varying levels of experience with spreadsheets.

Formula Type: {{{formulaType}}}
Formula: {{{formula}}}

Explanation:`,
});

const explainFormulaFlow = ai.defineFlow(
  {
    name: 'explainFormulaFlow',
    inputSchema: ExplainFormulaInputSchema,
    outputSchema: ExplainFormulaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
