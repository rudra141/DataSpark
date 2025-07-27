
'use client';

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart as BarChartIcon, Download, Loader2, Sparkles, Table } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { toPng } from 'html-to-image';

import { analyzeData, type AnalyzeDataOutput } from '@/ai/flows/analyze-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload } from '@/components/file-upload';
import { AppSidebar } from '@/components/app-sidebar';

type AnalysisResult = AnalyzeDataOutput;
type RecommendedVisualization = AnalysisResult['recommendedVisualizations'][0];

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

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

const InsightCard = ({ title, stats }: { title: string; stats: { columnName: string; value: string | number }[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-2 text-sm">
        {stats.map((stat, index) => (
          <li key={index} className="flex justify-between items-center gap-2">
            <span className="font-medium text-muted-foreground truncate pr-2">{stat.columnName}</span>
            <span className="font-mono text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{String(stat.value)}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const BarChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={vis.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Bar dataKey={vis.config.dataKey}>
                {vis.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const PieChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <RechartsPie data={vis.data} dataKey={vis.config.dataKey} nameKey={vis.config.indexKey} cx="50%" cy="50%" outerRadius={80} label>
                {vis.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
            </RechartsPie>
        </RechartsPieChart>
    </ResponsiveContainer>
);

const ScatterChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Scatter name="Data" data={vis.data} fill="hsl(var(--primary))" />
        </ScatterChart>
    </ResponsiveContainer>
);

const LineChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Line type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);


const DynamicChartRenderer = ({ visualization }: { visualization: RecommendedVisualization }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (chartRef.current === null) return;
    toPng(chartRef.current, { cacheBust: true, pixelRatio: 2, backgroundColor: 'hsl(var(--card))' })
      .then((dataUrl) => {
        const safeTitle = (visualization.title || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const link = document.createElement('a');
        link.download = `${safeTitle}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to download chart', err);
      });
  }, [visualization]);

  const renderChart = () => {
    if (!visualization?.chartType || !visualization.data || !visualization.config) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Chart data is incomplete.
        </div>
      );
    }
    
    switch (visualization.chartType) {
      case 'bar': return <BarChartRenderer vis={visualization} />;
      case 'pie': return <PieChartRenderer vis={visualization} />;
      case 'scatter': return <ScatterChartRenderer vis={visualization} />;
      case 'line': return <LineChartRenderer vis={visualization} />;
      default: return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported chart type: {visualization.chartType}</div>;
    }
  };

  return (
    <Card ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg">{visualization.title}</CardTitle>
          <CardDescription className="mt-1">{visualization.caption}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 ml-4 shrink-0">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download Chart</span>
        </Button>
      </CardHeader>
      <CardContent>
          <div className="h-80 w-full">
            {renderChart()}
          </div>
      </CardContent>
    </Card>
  );
};

export default function DataAnalyzerPage() {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoaded = (data: string, name: string) => {
    setCsvData(data);
    setFileName(name);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!csvData || !fileName) {
      setError("No data available to analyze. Please upload a file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const output = await analyzeData({ csvData, fileName });
      setResult(output);
    } catch (err: any) {
      setError("An error occurred during analysis. The file might be corrupted or in an unsupported format. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AppSidebar />
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChartIcon className="h-8 w-8 text-primary" />
              Data Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV file to get instant insights, statistics, and AI-recommended visualizations.
            </p>
          </header>

          <FileUpload onFileLoaded={handleFileLoaded}>
            <Button onClick={handleAnalyze} disabled={!csvData || isLoading}>
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
          </FileUpload>

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InsightCard title="Key Statistics" stats={result.summaryStats.stats} />
                  <InsightCard title="Missing Values" stats={result.missingValues.stats} />
                  <InsightCard title="Column Types" stats={result.columnTypes.stats} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {result.recommendedVisualizations.map((vis, index) => (
                    <DynamicChartRenderer key={index} visualization={vis} />
                  ))}
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
    </>
  )
}
