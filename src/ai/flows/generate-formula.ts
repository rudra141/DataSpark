'use server';

/**
 * @fileOverview Generates Excel and Google Sheets formulas from a natural language description.
 *
 * - generateFormula - A function that generates Excel and Google Sheets formulas from a natural language description.
 * - GenerateFormulaInput - The input type for the generateFormula function.
 * - GenerateFormulaOutput - The return type for the generateFormula function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFormulaInputSchema = z.object({
  description: z.string().describe('A natural language description of the desired calculation.'),
});
export type GenerateFormulaInput = z.infer<typeof GenerateFormulaInputSchema>;

const GenerateFormulaOutputSchema = z.object({
  excelFormula: z.string().describe('The Excel formula corresponding to the description.'),
  googleSheetsFormula: z.string().describe('The Google Sheets formula corresponding to the description.'),
  explanation: z.string().describe('A step-by-step explanation of how the formulas work.'),
});
export type GenerateFormulaOutput = z.infer<typeof GenerateFormulaOutputSchema>;

export async function generateFormula(input: GenerateFormulaInput): Promise<GenerateFormulaOutput> {
  return generateFormulaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFormulaPrompt',
  input: {schema: GenerateFormulaInputSchema},
  output: {schema: GenerateFormulaOutputSchema},
  prompt: `You are an expert in Excel and Google Sheets formulas.

  You will be given a description of a calculation that the user wants to perform.  You will generate both an Excel formula and a Google Sheets formula that performs the calculation.  You will also generate a step-by-step explanation of how the formulas work.  Ensure that the formulas are correct and efficient.

  Description: {{{description}}}
  `,
});

const generateFormulaFlow = ai.defineFlow(
  {
    name: 'generateFormulaFlow',
    inputSchema: GenerateFormulaInputSchema,
    outputSchema: GenerateFormulaOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
