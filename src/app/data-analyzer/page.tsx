
'use client';

import { useState, useMemo, ChangeEvent, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart as BarChartIcon, FileUp, Loader2, Sparkles, Table, Download, PieChart as PieChartIcon, BarChart2, Link as LinkIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell } from 'recharts';
import { toPng } from 'html-to-image';


import { analyzeData, type AnalyzeDataOutput } from '@/ai/flows/analyze-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type AnalysisResult = AnalyzeDataOutput;

const ResultSkeleton = () => (
  <div className="space-y-6">
    <Card>
       <CardHeader>
          <Skeleton className="h-7 w-3/4" />
           <Skeleton className="h-4 w-1/2" />
       </CardHeader>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

const InsightCard = ({ title, stats, emptyText = "No data available." }: { title: string; stats: { columnName: string; value: string | number }[], emptyText?: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm">
        {stats && stats.length > 0 ? (
          stats.map((stat, index) => (
            <li key={index} className="flex justify-between items-center gap-2">
              <span className="font-medium text-muted-foreground truncate pr-2">{stat.columnName}</span>
              <span className="font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded-md text-right">{String(stat.value)}</span>
            </li>
          ))
        ) : (
          <p className="text-muted-foreground">{emptyText}</p>
        )}
      </ul>
    </CardContent>
  </Card>
);

const ChartCardUI = ({ title, icon: Icon, children, onDownload }: { title: string; icon: React.ElementType, children: React.ReactNode, onDownload: () => void }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
       <Button variant="ghost" size="icon" onClick={onDownload} className="h-8 w-8">
        <Download className="h-4 w-4" />
        <span className="sr-only">Download Chart</span>
      </Button>
    </CardHeader>
    <CardContent>
      <div className="h-64 w-full">
        {children}
      </div>
    </CardContent>
  </Card>
);


export default function DataAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded: isUserLoaded } = useUser();
  
  const chartRefs = {
    missingValues: useRef<HTMLDivElement>(null),
    columnTypes: useRef<HTMLDivElement>(null),
    correlations: useRef<HTMLDivElement>(null),
  };
  
  const chartConfig = {
    // We can define colors and labels here for chart consistency later
  };

  const handleDownloadChart = useCallback((chartName: keyof typeof chartRefs) => {
    const ref = chartRefs[chartName].current;
    if (ref === null) {
      return;
    }
    toPng(ref, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${result?.fileName?.replace('.csv', '')}_${chartName}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download chart', err);
        setError('Could not download chart. Please try again.');
      });
  }, [chartRefs, result?.fileName]);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 1 * 1024 * 1024) { // 1MB limit
        setError("File is too large. Please upload a file smaller than 1MB.");
        setFile(null);
        return;
      }
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Invalid file type. Please upload a .csv file.");
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a file to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileContent = await file.text();
      const output = await analyzeData({ csvData: fileContent, fileName: file.name });
      setResult(output);
    } catch (err: any) {
      setError("An error occurred during analysis. The file might be corrupted or in an unsupported format. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isReady = isUserLoaded;
  
  const pieChartData = useMemo(() => {
    if (!result) return [];
    const typeCounts = result.columnTypes.stats.reduce((acc, curr) => {
      const type = String(curr.value);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [result]);
  
  const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];
  
  const missingValuesData = useMemo(() => {
    if (!result) return [];
    return result.missingValues.stats.filter(s => Number(s.value) > 0);
  }, [result]);

  const correlationData = useMemo(() => {
    if (!result) return [];
    return result.correlationAnalysis.stats;
  }, [result]);


  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChartIcon className="h-8 w-8 text-primary" />
              Data Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV file to get instant insights, statistics, and visualizations about your data.
            </p>
          </header>

          <AnimatePresence mode="wait">
            {!isReady ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Your Data File</CardTitle>
                    <CardDescription>
                      Select a .csv file from your computer. Max file size: 1MB.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <label htmlFor="file-upload" className="flex-1 w-full">
                        <div className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileUp className="h-6 w-6" />
                            <span>{file ? file.name : 'Click to select a file'}</span>
                          </div>
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv" />
                      </label>
                      <Button onClick={handleAnalyze} disabled={!file || isLoading} className="w-full sm:w-auto">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" /> Analyze Data
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isLoading && <ResultSkeleton key="skeleton" />}

            {result && !isLoading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                   <CardHeader>
                      <CardTitle className="text-xl">Analysis for: {result.fileName}</CardTitle>
                       <CardDescription>
                          Found {result.rowCount} rows and {result.columnCount} columns.
                       </CardDescription>
                   </CardHeader>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <InsightCard title={result.summaryStats.title} stats={result.summaryStats.stats} />
                  <InsightCard title={result.missingValues.title} stats={missingValuesData} emptyText="No missing values found." />
                  <InsightCard title={result.columnTypes.title} stats={result.columnTypes.stats} />
                  <InsightCard title={result.outlierAnalysis.title} stats={result.outlierAnalysis.stats} emptyText="No significant outliers detected." />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {missingValuesData.length > 0 && (
                    <div ref={chartRefs.missingValues}>
                      <ChartCardUI title="Missing Values" icon={BarChart2} onDownload={() => handleDownloadChart('missingValues')}>
                        <ChartContainer config={chartConfig} className="h-full w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={missingValuesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="columnName" />
                                <YAxis />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" name="Missing Count" fill="hsl(var(--primary))" />
                              </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                      </ChartCardUI>
                    </div>
                  )}

                  <div ref={chartRefs.columnTypes}>
                    <ChartCardUI title="Column Types" icon={PieChartIcon} onDownload={() => handleDownloadChart('columnTypes')}>
                      <ChartContainer config={chartConfig} className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <RechartsPie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="hsl(var(--primary))" label>
                               {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                              ))}
                            </RechartsPie>
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </ChartCardUI>
                   </div>

                   {correlationData.length > 0 && (
                     <div ref={chartRefs.correlations} className="lg:col-span-2">
                      <ChartCardUI title="Top Correlations" icon={LinkIcon} onDownload={() => handleDownloadChart('correlations')}>
                          <ChartContainer config={chartConfig} className="h-full w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={correlationData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis type="number" domain={[-1, 1]} />
                                      <YAxis dataKey="columnName" type="category" width={120} />
                                      <Tooltip content={<ChartTooltipContent />} />
                                      <Legend />
                                      <Bar dataKey="value" name="Correlation" fill="hsl(var(--primary))" />
                                  </BarChart>
                              </ResponsiveContainer>
                          </ChartContainer>
                      </ChartCardUI>
                    </div>
                   )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      Column Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {result.columnNames.map(name => (
                        <div key={name} className="p-2 bg-muted/50 rounded-md text-sm truncate" title={name}>
                          {name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </SidebarProvider>
  );
}
