
'use server';

/**
 * @fileOverview Refines a user's natural language request for chart generation into a more specific and detailed prompt.
 *
 * - enhanceChartRequest - A function that refines the user's chart request.
 * - EnhanceChartRequestInput - The input type for the enhanceChartRequest function.
 * - EnhanceChartRequestOutput - The return type for the enhanceChartRequest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhanceChartRequestInputSchema = z.object({
  request: z.string().describe("The user's initial, natural language description of the desired chart."),
  columnNames: z.array(z.string()).describe("The list of column names from the user's CSV data."),
});
export type EnhanceChartRequestInput = z.infer<typeof EnhanceChartRequestInputSchema>;

const EnhanceChartRequestOutputSchema = z.object({
  enhancedRequest: z.string().describe('The refined and more detailed description for the chart generation model.'),
});
export type EnhanceChartRequestOutput = z.infer<typeof EnhanceChartRequestOutputSchema>;

export async function enhanceChartRequest(input: EnhanceChartRequestInput): Promise<EnhanceChartRequestOutput> {
  return enhanceChartRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceChartRequestPrompt',
  input: { schema: EnhanceChartRequestInputSchema },
  output: { schema: EnhanceChartRequestOutputSchema },
  prompt: `You are an expert data analyst who specializes in translating vague user requests into precise, actionable instructions for a chart generation AI.

Given the user's request and the list of available column names from their dataset, your task is to refine and expand the request. The goal is to make it as unambiguous as possible for another AI that will generate the chart.

**Key Instructions:**
1.  **Analyze the User's Intent:** Understand what the user is trying to visualize, even if their request is simple (e.g., "show sales").
2.  **Select Appropriate Columns:** Based on the user's request, choose the most relevant column names from the provided list. Use the exact column names in your output, enclosed in backticks (e.g., \`Sales_USD\`).
3.  **Determine Chart Type:** Suggest the most appropriate chart type (bar chart, pie chart, line chart, scatter plot).
4.  **Specify Aggregation:** Clarify how the data should be grouped or aggregated (e.g., "total sales," "average price," "count of products").
5.  **Formulate a Clear Request:** Combine the above elements into a single, clear, and concise instruction. The output should be a direct command for the other AI.

**Example:**
-   **User Request:** "I want to see how products are doing"
-   **Column Names:** ["ProductName", "UnitsSold", "Region", "SaleDate"]
-   **Your Enhanced Request:** "Create a bar chart of the total \`UnitsSold\` for each \`ProductName\`"

**Input:**
-   **User Request:** "{{request}}"
-   **Column Names:** [{{#each columnNames}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}]

Your entire output must be a single JSON object with the "enhancedRequest" field. Do not add any commentary.
`,
});

const enhanceChartRequestFlow = ai.defineFlow(
  {
    name: 'enhanceChartRequestFlow',
    inputSchema: EnhanceChartRequestInputSchema,
    outputSchema: EnhanceChartRequestOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid enhanced request.");
    }
    return output;
  }
);
