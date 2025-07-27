
'use client';

import { useState, useRef, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart as BarChartIcon, Bot, Download, FileClock, Link as LinkIcon, Loader2, Sparkles, Table, Trash2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Treemap } from 'recharts';
import { toPng } from 'html-to-image';

import { analyzeData, type AnalyzeDataOutput } from '@/ai/flows/analyze-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/app-sidebar';
import { Table as UiTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataContext } from '@/context/data-context';
import { FileUpload } from '@/components/file-upload';
import { useUser } from '@clerk/nextjs';
import short from 'short-uuid';
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

type AnalysisResult = AnalyzeDataOutput;
type RecommendedVisualization = AnalysisResult['recommendedVisualizations'][0];
type FileHistoryItem = {
  id: string;
  fileName: string;
  csvData: string;
};

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

const InsightCard = ({ title, stats, emptyText = "No data available." }: { title: string; stats?: { columnName: string; value: string | number }[], emptyText?: string }) => (
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

const BarChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={vis.data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} angle={-30} textAnchor="end" height={60} interval={0} tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -15 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
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
            <XAxis type="number" dataKey="x" name={vis.config.xAxisLabel || 'x'} tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -10 }} />
            <YAxis type="number" dataKey="y" name={vis.config.yAxisLabel || 'y'} tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Scatter name="Data" data={vis.data} fill="hsl(var(--primary))" />
        </ScatterChart>
    </ResponsiveContainer>
);

const LineChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} angle={-30} textAnchor="end" height={60} interval="preserveStartEnd" tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -15 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Line type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);

const AreaChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} angle={-30} textAnchor="end" height={60} interval="preserveStartEnd" tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -15 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Area type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
        </AreaChart>
    </ResponsiveContainer>
);

const TreemapRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <Treemap
            data={vis.data}
            dataKey={vis.config.dataKey || 'size'}
            nameKey={vis.config.indexKey || 'name'}
            aspectRatio={4 / 3}
            stroke="hsl(var(--card))"
            fill="hsl(var(--muted))"
        >
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
        </Treemap>
    </ResponsiveContainer>
);

const DynamicChartRenderer = ({ visualization }: { visualization: RecommendedVisualization }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleChat = () => {
    const chatQuery = `Tell me more about the chart: "${visualization.title}" which shows "${visualization.caption}"`;
    router.push(`/chat-with-data?q=${encodeURIComponent(chatQuery)}`);
  };

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
      case 'histogram': return <BarChartRenderer vis={visualization} />;
      case 'pie': return <PieChartRenderer vis={visualization} />;
      case 'scatter': return <ScatterChartRenderer vis={visualization} />;
      case 'line': return <LineChartRenderer vis={visualization} />;
      case 'area': return <AreaChartRenderer vis={visualization} />;
      case 'treemap': return <TreemapRenderer vis={visualization} />;
      default: return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported chart type: {visualization.chartType}</div>;
    }
  };

  return (
    <Card ref={chartRef} className="bg-card flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg">{visualization.title}</CardTitle>
          <CardDescription className="mt-1">{visualization.caption}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 ml-4 shrink-0">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download Chart</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-grow">
          <div className="h-80 w-full">
            {renderChart()}
          </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={handleChat}>
          <Bot className="h-4 w-4 mr-2" />
          Chat about this chart
        </Button>
      </CardFooter>
    </Card>
  );
};

const DataAnalyzerPageContent = () => {
  const { csvData, fileName, setCsvData, setFileName, fileHistory, setFileHistory, isHistoryReady } = useContext(DataContext);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const handleFileLoaded = (data: string, name: string) => {
    setCsvData(data);
    setFileName(name);
    setResult(null);
    setError(null);

    // Add to history
    if (user?.id) {
        const newHistoryItem: FileHistoryItem = { id: short.generate(), fileName: name, csvData: data };
        setFileHistory(prev => [newHistoryItem, ...prev.filter(item => item.fileName !== name)]);
    }
  };

  const handleHistorySelect = (item: FileHistoryItem) => {
    setCsvData(item.csvData);
    setFileName(item.fileName);
    setResult(null); // Clear previous results when a new file is selected from history
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
  
  const clearHistory = () => {
    setFileHistory([]);
    if (user?.id) {
        localStorage.removeItem(`fileHistory_${user.id}`);
    }
  };

  return (
    <>
      <AppSidebar>
         <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <FileClock />
              File History
            </SidebarGroupLabel>
            {isHistoryReady && fileHistory.length > 0 && (
              <SidebarGroupAction asChild>
                <button onClick={clearHistory} title="Clear file history">
                  <Trash2 />
                </button>
              </SidebarGroupAction>
            )}
            <SidebarMenu>
              {!isHistoryReady ? (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </div>
              ) : fileHistory.length > 0 ? (
                fileHistory.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className="h-auto py-1"
                      onClick={() => handleHistorySelect(item)}
                      isActive={fileName === item.fileName}
                      tooltip={{ children: item.fileName, side: "right", align: "center" }}
                    >
                      <span className="truncate">{item.fileName}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <p className="px-2 text-xs text-muted-foreground">No files loaded yet.</p>
              )}
            </SidebarMenu>
          </SidebarGroup>
      </AppSidebar>
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChartIcon className="h-8 w-8 text-primary" />
              Data Analyzer
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV or XLSX file to get instant insights, statistics, and AI-recommended visualizations.
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

                {result.executiveSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{result.executiveSummary}</p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.summaryStats && <InsightCard title="Key Statistics" stats={result.summaryStats.stats} emptyText="No summary statistics generated."/>}
                  {result.missingValues && <InsightCard title={result.missingValues.title} stats={result.missingValues.stats} emptyText="No missing values found." />}
                  {result.columnTypes && <InsightCard title={result.columnTypes.title} stats={result.columnTypes.stats} />}
                </div>

                {result.correlationAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                          <LinkIcon className="h-5 w-5" />
                          {result.correlationAnalysis.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.correlationAnalysis.correlations.map((corr, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium">{corr.variable1} & {corr.variable2}: <span className="font-mono text-primary">{corr.correlation.toFixed(2)}</span></p>
                          <p className="text-sm text-muted-foreground">{corr.interpretation}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {result.segmentationAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {result.segmentationAnalysis.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UiTable>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Segment</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.segmentationAnalysis.segments.map((seg, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{seg.name}</TableCell>
                              <TableCell>{seg.description}</TableCell>
                              <TableCell className="text-right font-mono">{seg.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </UiTable>
                    </CardContent>
                  </Card>
                )}
                
                {result.recommendedVisualizations.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {result.recommendedVisualizations.map((vis, index) => (
                        <DynamicChartRenderer key={index} visualization={vis} />
                      ))}
                  </div>
                )}
                
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

export default function DataAnalyzerPage() {
  return (
    <DataAnalyzerPageContent />
  );
}

    