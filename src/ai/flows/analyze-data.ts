
'use server';

/**
 * @fileOverview Analyzes CSV data and provides EDA insights.
 *
 * - analyzeData - A function that performs EDA and recommends charts.
 * - AnalyzeDataInput - The input type for the analyzeData function.
 * - AnalyzeDataOutput - The return type for the analyzeData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDataInputSchema = z.object({
  csvData: z.string().describe('The full content of the CSV file as a single string.'),
  fileName: z.string().describe('The name of the uploaded file.'),
});
export type AnalyzeDataInput = z.infer<typeof AnalyzeDataInputSchema>;

const AnalyzeDataPromptInputSchema = AnalyzeDataInputSchema.extend({
    rowCount: z.number().describe('The pre-calculated number of rows in the CSV data.'),
});

const ColumnStatSchema = z.object({
  columnName: z.string(),
  value: z.union([z.string(), z.number()]),
});

const ChartDataItemSchema = z.object({
    name: z.string().optional().describe("The label for a data point (e.g., on the x-axis of a bar chart)."),
    value: z.number().optional().describe("The primary numerical value for a data point (e.g., the height of a bar)."),
    x: z.number().optional().describe("The x-coordinate for a scatter plot."),
    y: z.number().optional().describe("The y-coordinate for a scatter plot."),
    z: z.number().optional().describe("The size value for a scatter plot bubble."),
}).describe("A single data item for a chart, accommodating various chart types.");


const RecommendedVisualizationSchema = z.object({
    chartType: z.enum(['bar', 'pie', 'scatter', 'line']).describe('The type of chart recommended.'),
    title: z.string().describe('A descriptive title for the chart.'),
    caption: z.string().describe('A brief caption explaining the insight from the chart.'),
    data: z.array(ChartDataItemSchema).describe('The data structured for the chart. For scatter plots, should contain x and y keys. For others, typically name and value keys.'),
    config: z.object({
        dataKey: z.string().describe("The key for the main data value in the data array (e.g., 'value' or 'count')."),
        indexKey: z.string().describe("The key for the label/index in the data array (e.g., 'name' or 'date')."),
    }).describe('Configuration for rendering the chart.'),
});

const AnalyzeDataOutputSchema = z.object({
  fileName: z.string().describe('The name of the analyzed file.'),
  rowCount: z.number().describe('The total number of rows in the dataset.'),
  columnCount: z.number().describe('The total number of columns in the dataset.'),
  columnNames: z.array(z.string()).describe('An array of all column names.'),
  summaryStats: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('General descriptive statistics for the dataset.'),
  missingValues: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('Columns with the most missing values and their counts.'),
  columnTypes: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('The inferred data type for each column (e.g., Numeric, Categorical, Text).'),
  recommendedVisualizations: z.array(RecommendedVisualizationSchema).describe('An array of up to 4 AI-recommended visualizations based on the data analysis.'),
});
export type AnalyzeDataOutput = z.infer<typeof AnalyzeDataOutputSchema>;


export async function analyzeData(input: AnalyzeDataInput): Promise<AnalyzeDataOutput> {
  return analyzeDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDataPrompt',
  input: {schema: AnalyzeDataPromptInputSchema},
  output: {schema: AnalyzeDataOutputSchema.omit({ rowCount: true })},
  prompt: `You are an expert data analyst. A user has uploaded a dataset named '{{{fileName}}}' for analysis.
The dataset has already been determined to have {{{rowCount}}} rows.

Your task is to perform a comprehensive analysis and generate a single JSON object.

**JSON Output Structure:**
1.  **Basic Info**: fileName, columnCount, columnNames.
2.  **Key Statistics**: General descriptive statistics for key columns.
3.  **Missing Values**: Columns with the most missing values and their counts.
4.  **Column Types**: The inferred data type for each column (e.g., Numeric, Categorical, Text).
5.  **Recommended Visualizations**: Generate up to 4 relevant and insightful visualizations based on the data. For each visualization, you **MUST** provide a \`title\`, \`caption\`, \`chartType\`, \`data\`, and \`config\`.
    -   Choose the best \`chartType\`: 'bar', 'pie', 'scatter', or 'line'.
    -   Provide a clear \`title\` and \`caption\`.
    -   Generate the \`data\` array needed to render the chart.

Analyze the following CSV data:
\`\`\`csv
{{{csvData}}}
\`\`\`

Your entire output must be a single JSON object that strictly adheres to the provided output schema. Do not add any commentary outside the JSON.`,
});

const analyzeDataFlow = ai.defineFlow(
  {
    name: 'analyzeDataFlow',
    inputSchema: AnalyzeDataInputSchema,
    outputSchema: AnalyzeDataOutputSchema,
  },
  async (input) => {
    // Pre-calculate row count to ensure accuracy.
    const rowCount = input.csvData.trim().split('\n').filter(line => line.trim() !== '').length - 1;

    // Truncate large files to keep the prompt size reasonable.
    const MAX_PROMPT_LENGTH = 25000;
    const truncatedCsvData = input.csvData.length > MAX_PROMPT_LENGTH
      ? input.csvData.substring(0, MAX_PROMPT_LENGTH) + "\n... (data truncated)"
      : input.csvData;

    const { output: modelOutput } = await prompt({ ...input, csvData: truncatedCsvData, rowCount });

    if (!modelOutput) {
      throw new Error("The AI model did not return a valid analysis.");
    }
    
    // Combine the model output with the pre-calculated row count.
    const finalOutput = {
      ...modelOutput,
      rowCount: rowCount,
    };

    // Final validation to ensure the entire object is compliant.
    try {
      return AnalyzeDataOutputSchema.parse(finalOutput);
    } catch (error) {
        console.error("Final output validation failed:", error);
        throw new Error("Failed to construct a valid analysis object from the AI's response.");
    }
  }
);
