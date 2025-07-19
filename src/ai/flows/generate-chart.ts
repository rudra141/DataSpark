
'use server';

/**
 * @fileOverview Generates a specific visualization based on user's natural language request on a CSV dataset.
 *
 * - generateChart - A function that creates a single chart from a user's request.
 * - GenerateChartInput - The input type for the generateChart function.
 * - GenerateChartOutput - The return type for the generateChart function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Re-using the robust schemas from the data-analyzer flow for consistency.
const ChartDataItemSchema = z.object({
    name: z.string().optional().describe("The label for a data point (e.g., on the x-axis of a bar chart)."),
    value: z.number().optional().describe("The primary numerical value for a data point (e.g., the height of a bar)."),
    size: z.number().optional().describe("The numerical value used for treemaps or other size-based charts."),
    x: z.number().optional().describe("The x-coordinate for a scatter plot."),
    y: z.number().optional().describe("The y-coordinate for a scatter plot."),
    z: z.number().optional().describe("The size value for a scatter plot bubble."),
    children: z.array(z.lazy(() => ChartDataItemSchema)).optional().describe("Child nodes for hierarchical charts like treemaps."),
}).describe("A single data item for a chart, accommodating various chart types.");

const RecommendedVisualizationSchema = z.object({
    chartType: z.enum(['bar', 'pie', 'scatter', 'line', 'area', 'treemap']).describe('The type of chart recommended.'),
    title: z.string().describe('A descriptive title for the chart.'),
    caption: z.string().describe('A brief caption explaining the insight from the chart.'),
    data: z.array(ChartDataItemSchema).describe('The data structured for the chart. For scatter plots, should contain x, y, and z (size) keys. For others, typically name and value keys. For treemaps, use name and size.'),
    config: z.object({
        dataKey: z.string().describe("The key for the main data value in the data array (e.g., 'value' or 'count'). For treemaps, this should be 'size'."),
        indexKey: z.string().describe("The key for the label/index in the data array (e.g., 'name' or 'date')."),
        xAxisLabel: z.string().optional().describe("Label for the X-axis."),
        yAxisLabel: z.string().optional().describe("Label for the Y-axis."),
    }).describe('Configuration for rendering the chart.'),
});

const GenerateChartInputSchema = z.object({
  csvData: z.string().describe('The full content of the CSV file as a single string.'),
  request: z.string().describe("The user's natural language request for a specific chart."),
});
export type GenerateChartInput = z.infer<typeof GenerateChartInputSchema>;

// The output is a single visualization object, or null if it cannot be generated.
export type GenerateChartOutput = z.infer<typeof RecommendedVisualizationSchema> | null;


export async function generateChart(input: GenerateChartInput): Promise<GenerateChartOutput> {
  return generateChartFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChartPrompt',
  input: {schema: GenerateChartInputSchema},
  output: {schema: RecommendedVisualizationSchema},
  prompt: `You are an expert data visualization assistant. A user has uploaded a CSV dataset and wants you to create a specific chart based on their request.

Your task is to analyze the user's request and the provided CSV data, and then generate a single JSON object that represents the requested visualization.

**User Request**: "{{request}}"

**Instructions**:
1.  Read the user's request carefully to understand the desired chart type (bar, pie, scatter, line, area, treemap), the data columns to use, and any other specifications.
2.  Analyze the provided CSV data to extract and structure the data needed for the chart.
3.  Generate a single JSON object that strictly adheres to the output schema. This object **MUST** have a 'title', 'caption', 'chartType', 'data', and 'config'.
4.  If the request is ambiguous or cannot be fulfilled with the given data, you should still attempt to create the most reasonable chart possible that matches the user's intent. Do not ask for clarification.
5.  Ensure the 'data' array in your JSON output is correctly formatted for the specified 'chartType'.
    -   For bar, pie, line, and area charts, use 'name' and 'value' keys.
    -   For scatter plots, use 'x', 'y', and 'z' keys.
    -   For treemaps, use 'name' and 'size' keys.

**CSV Data**:
\`\`\`csv
{{{csvData}}}
\`\`\`

Your entire output must be a single, valid JSON object for the visualization. Do not add any commentary outside the JSON.`,
});

const generateChartFlow = ai.defineFlow(
  {
    name: 'generateChartFlow',
    inputSchema: GenerateChartInputSchema,
    outputSchema: z.nullable(RecommendedVisualizationSchema),
  },
  async (input) => {
    
    // Truncate large files to keep the prompt size reasonable.
    const MAX_PROMPT_LENGTH = 25000;
    const truncatedCsvData = input.csvData.length > MAX_PROMPT_LENGTH
      ? input.csvData.substring(0, MAX_PROMPT_LENGTH) + "\n... (data truncated)"
      : input.csvData;
      
    const { output } = await prompt({ ...input, csvData: truncatedCsvData });

    if (!output) {
      console.warn("AI model did not return an output for generateChart.");
      return null;
    }
    
    // DEFINITIVE FIX: Use safeParse to validate the output. This is the most robust way to handle
    // potential malformations from the AI. If it's invalid, return null instead of crashing.
    const validationResult = RecommendedVisualizationSchema.safeParse(output);
    
    if (validationResult.success) {
      // The object is 100% valid, return it.
      return validationResult.data;
    } else {
      // The AI returned a malformed object. Log the error for debugging and return null.
      // This prevents the application from crashing.
      console.error("AI returned a malformed visualization object:", validationResult.error.errors);
      return null;
    }
  }
);
