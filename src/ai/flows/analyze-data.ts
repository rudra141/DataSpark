
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
    chartType: z.enum(['bar', 'pie', 'scatter', 'line', 'area', 'treemap', 'histogram']).describe('The type of chart recommended.'),
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

const CorrelationSchema = z.object({
  variable1: z.string(),
  variable2: z.string(),
  correlation: z.number().describe('The correlation coefficient, from -1 to 1.'),
  interpretation: z.string().describe('A plain-English interpretation of the correlation.'),
});

const SegmentSchema = z.object({
  name: z.string().describe('The name of the segment (e.g., "High-Value Customers").'),
  description: z.string().describe('A description of the segment\'s characteristics.'),
  count: z.number().describe('The number of data points in this segment.'),
});

const AnalyzeDataOutputSchema = z.object({
  fileName: z.string().describe('The name of the analyzed file.'),
  rowCount: z.number().describe('The total number of rows in the dataset.'),
  columnCount: z.number().describe('The total number of columns in the dataset.'),
  columnNames: z.array(z.string()).describe('An array of all column names.'),
  executiveSummary: z.string().describe("A concise, one-paragraph summary of the most critical insights from the dataset.").optional(),
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
  correlationAnalysis: z.object({
    title: z.string(),
    correlations: z.array(CorrelationSchema).describe('An array of the most significant correlations found.'),
  }).describe('An analysis of correlations between numeric columns.').optional(),
  segmentationAnalysis: z.object({
      title: z.string(),
      segments: z.array(SegmentSchema).describe('An array of identified customer/data segments.'),
  }).describe('An analysis of distinct segments or clusters in the data.').optional(),
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

Your task is to perform a comprehensive analysis and generate a single JSON object.

**JSON Output Structure:**
1.  **Basic Info**: fileName, columnCount, columnNames.
2.  **Executive Summary**: (Optional) Provide a concise, one-paragraph summary of the most critical insights a business leader would want to know. If the data is not suitable for a summary, omit this field.
3.  **Key Statistics**: (Optional) General descriptive statistics. Title should be 'Key Statistics'. Omit if not applicable.
4.  **Missing Values**: (Optional) Top columns with missing data. Title should be 'Missing Values'. Omit if none.
5.  **Column Types**: Inferred data types for each column. Title should be 'Column Types'.
6.  **Correlation Analysis**: (Optional) If there are multiple numeric columns, identify the most significant positive or negative correlations. For each, provide the two variables, the correlation coefficient, and a plain-English interpretation. Title should be 'Correlation Analysis'. Omit if not applicable.
7.  **Segmentation Analysis**: (Optional) If the data appears to contain distinct groups (e.g., customer data), identify 2-4 segments. For each, provide a name, description, and count. Title should be 'Segmentation Analysis'. Omit if not applicable.
8.  **Recommended Visualizations**: This is crucial. Generate all relevant and insightful visualizations based on the data. The number of visualizations should be determined by the data's potential for insights, not by a fixed limit. For each visualization, you **MUST** provide a \`title\`, \`caption\`, \`chartType\`, \`data\`, and \`config\`.
    -   Choose the best \`chartType\`: 'bar', 'pie', 'scatter', 'line', 'area', 'treemap', or 'histogram'.
    -   Provide a clear \`title\` and \`caption\`.
    -   Generate the \`data\` array needed to render the chart.

**Example for a Correlation:**
\`\`\`json
{
  "correlationAnalysis": {
    "title": "Correlation Analysis",
    "correlations": [
      {
        "variable1": "YearsExperience",
        "variable2": "Salary",
        "correlation": 0.98,
        "interpretation": "There is a very strong positive correlation between years of experience and salary, meaning salary tends to increase significantly with more experience."
      }
    ]
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
      executiveSummary: modelOutput.executiveSummary,
      summaryStats: modelOutput.summaryStats,
      missingValues: modelOutput.missingValues,
      columnTypes: modelOutput.columnTypes,
      correlationAnalysis: modelOutput.correlationAnalysis,
      segmentationAnalysis: modelOutput.segmentationAnalysis,
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
