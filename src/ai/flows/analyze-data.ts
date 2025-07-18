'use server';

/**
 * @fileOverview Analyzes the content of a CSV file to provide exploratory data analysis (EDA) insights.
 *
 * - analyzeData - A function that performs EDA on CSV data.
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

const ColumnStatSchema = z.object({
  columnName: z.string(),
  value: z.union([z.string(), z.number()]),
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
  correlationAnalysis: z.object({
    title: z.string(),
    stats: z.array(z.object({ columnName: z.string().describe("e.g., 'ColumnA - ColumnB'"), value: z.number().describe("The correlation coefficient") })),
  }).describe('Top 3 most correlated pairs of numerical columns.'),
  outlierAnalysis: z.object({
    title: z.string(),
    stats: z.array(ColumnStatSchema),
  }).describe('Columns identified as potentially having outliers, with a brief reason.'),
});
export type AnalyzeDataOutput = z.infer<typeof AnalyzeDataOutputSchema>;


export async function analyzeData(input: AnalyzeDataInput): Promise<AnalyzeDataOutput> {
  return analyzeDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDataPrompt',
  input: {schema: AnalyzeDataInputSchema},
  output: {schema: AnalyzeDataOutputSchema},
  prompt: `You are an expert data analyst specializing in Exploratory Data Analysis (EDA).

Given the raw text content of a CSV file, perform a thorough analysis and provide a structured summary. The user has uploaded a file named '{{{fileName}}}'.

Analyze the following CSV data:
\`\`\`csv
{{{csvData}}}
\`\`\`

Based on your analysis, provide the following information in the specified JSON format:
1.  **File Name**: Return the original file name.
2.  **Row and Column Count**: Determine the number of rows (excluding the header) and columns.
3.  **Column Names**: List all column headers.
4.  **Summary Statistics**: Provide key descriptive stats. For numerical columns, this might include mean, median, and standard deviation. For categorical columns, it could be the mode or number of unique values. Present this as a list of key-value pairs. Title should be 'Key Statistics'.
5.  **Missing Values**: Identify the top 3 columns with the most missing or empty values and report the count for each. If there are no missing values, state that. Title should be 'Missing Values'.
6.  **Column Types**: Infer the data type for each column (e.g., Numeric, Categorical, Boolean, Date, Text). Present this as a list of key-value pairs. Title should be 'Column Types'.
7.  **Correlation Analysis**: Identify the top 3 most positively or negatively correlated pairs of numerical columns. Report the correlation coefficient for each pair. If not enough numerical columns exist, state that. Title should be 'Top Correlations'.
8.  **Outlier Analysis**: Identify up to 3 columns that likely contain outliers. For each, provide a brief note (e.g., 'High standard deviation'). If no significant outliers are apparent, state that. Title should be 'Potential Outliers'.

Your entire output must be a single JSON object that strictly adheres to the provided output schema.
`,
});

const analyzeDataFlow = ai.defineFlow(
  {
    name: 'analyzeDataFlow',
    inputSchema: AnalyzeDataInputSchema,
    outputSchema: AnalyzeDataOutputSchema,
  },
  async input => {
    // For very large files, we might only send a sample to the model.
    // Here, we'll truncate the input to keep the prompt reasonably sized.
    const MAX_PROMPT_LENGTH = 20000;
    const truncatedCsvData = input.csvData.length > MAX_PROMPT_LENGTH
      ? input.csvData.substring(0, MAX_PROMPT_LENGTH) + "\n... (data truncated)"
      : input.csvData;

    const {output} = await prompt({ ...input, csvData: truncatedCsvData });
    return output!;
  }
);
