
'use server';

/**
 * @fileOverview Analyzes CSV data, provides EDA insights, and recommends specific visualizations.
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


const AnalyzeDataOutputSchema = z.object({
  fileName: z.string().describe('The name of the analyzed file.'),
  rowCount: z.number().describe('The total number of rows in the dataset.'),
  columnCount: z.number().describe('The total number of columns in the dataset.'),
  columnNames: z.array(z.string()).describe('An array of all column names.'),
  summaryStats: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('General descriptive statistics for the dataset.').optional(),
  missingValues: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('Columns with the most missing values and their counts.').optional(),
  columnTypes: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('The inferred data type for each column (e.g., Numeric, Categorical, Text).').optional(),
  recommendedVisualizations: z.array(RecommendedVisualizationSchema).describe('An array of AI-recommended visualizations based on the data analysis.'),
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

Based on your analysis of the CSV data, generate a JSON output containing:
1.  **Basic Info**: fileName, columnCount, columnNames.
2.  **Key Statistics**: A summary of important stats for numerical and categorical columns. Title should be 'Key Statistics'. If not applicable, omit this field.
3.  **Missing Values**: Top columns with missing data and their counts. Title should be 'Missing Values'. If no missing values, omit this field.
4.  **Column Types**: Inferred data types for each column. Title should be 'Column Types'.
5.  **Recommended Visualizations**: This is the most important part. Analyze the data to find the most insightful stories and generate up to 4 of the most relevant visualizations to tell these stories. For each visualization, you **MUST** provide a \`title\`, \`caption\`, \`chartType\`, \`data\`, and \`config\`.
    -   Choose the best \`chartType\`: 'bar', 'pie', 'scatter', 'line', 'area', or 'treemap'.
    -   Provide a clear \`title\` and a concise \`caption\` explaining the insight.
    -   Generate the \`data\` array needed to render the chart with Recharts, adhering to the ChartDataItemSchema.
        -   For bar/pie/line/area charts, use objects with 'name' and 'value' keys.
        -   For scatter plots, use 'x', 'y', and 'z' (for bubble size) keys.
        -   For treemaps, use 'name' and 'size' keys.
    -   Provide a \`config\` object with \`dataKey\` (the main value, e.g., 'value' or 'size'), \`indexKey\` (the label, e.g., 'name'), and optional axis labels.

**Example for a recommended bar chart:**
\`\`\`json
{
  "chartType": "bar",
  "title": "Sales by Region",
  "caption": "North America has the highest sales.",
  "data": [
    { "name": "North America", "value": 5000 },
    { "name": "Europe", "value": 3200 }
  ],
  "config": {
    "dataKey": "value",
    "indexKey": "name"
  }
}
\`\`\`

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

    // DEFINITIVE FIX: Manually build the final output and rigorously validate/filter each visualization.
    const validVisualizations: z.infer<typeof RecommendedVisualizationSchema>[] = [];
    if (Array.isArray(modelOutput.recommendedVisualizations)) {
      modelOutput.recommendedVisualizations.forEach((vis, index) => {
        // Use Zod's safeParse to validate each visualization object without throwing an error.
        const validationResult = RecommendedVisualizationSchema.safeParse(vis);
        
        if (validationResult.success) {
          // Only add the visualization if it's 100% compliant with the schema.
          validVisualizations.push(validationResult.data);
        } else {
          // Log the error for debugging but don't crash the application.
          console.warn(`Skipping malformed visualization object at index ${index} from AI due to validation errors:`, validationResult.error.errors);
        }
      });
    }

    // Construct the final output object manually from AI response and validated data.
    // This ensures no malformed data is ever passed to the final validation step.
    const finalOutput: AnalyzeDataOutput = {
      fileName: modelOutput.fileName || input.fileName,
      rowCount: rowCount, // Guaranteed to be correct.
      columnCount: modelOutput.columnCount || 0,
      columnNames: modelOutput.columnNames || [],
      summaryStats: modelOutput.summaryStats,
      missingValues: modelOutput.missingValues,
      columnTypes: modelOutput.columnTypes,
      recommendedVisualizations: validVisualizations, // Guaranteed to be an array of valid visualizations.
    };

    // Final validation of the entire object before returning.
    // This should now always pass because we've cleaned the data.
    try {
      return AnalyzeDataOutputSchema.parse(finalOutput);
    } catch (error) {
      console.error("Final output validation failed. This should not happen. Error:", error);
      // As a last resort, throw an error if the manually constructed object is still invalid.
      throw new Error("Failed to construct a valid analysis object from the AI's response.");
    }
  }
);
