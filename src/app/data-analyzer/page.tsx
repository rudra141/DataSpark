
'use client';

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart as BarChartIcon, Download, Loader2, Sparkles, Table, BrainCircuit, Users, LineChart as LineChartIcon, FileUp, PieChartIcon, AreaChartIcon, ScatterChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Treemap } from 'recharts';
import { toPng } from 'html-to-image';
import * as XLSX from 'xlsx';

import { analyzeData, type AnalyzeDataOutput } from '@/ai/flows/analyze-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/app-layout';
import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient';
import { Badge } from '@/components/ui/badge';

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

const InsightCard = ({ title, stats, icon: Icon }: { title: string; stats: { columnName: string; value: string | number }[], icon?: React.ElementType }) => (
  <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900 h-full">
    <Card className="bg-transparent border-none shadow-none h-full text-white">
        <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
        </CardTitle>
        </CardHeader>
        <CardContent>
        <ul className="space-y-2 text-sm">
            {stats.map((stat, index) => (
            <li key={index} className="flex justify-between items-center gap-2">
                <span className="font-medium text-neutral-400 truncate pr-2">{stat.columnName}</span>
                <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded-md">{String(stat.value)}</span>
            </li>
            ))}
        </ul>
        </CardContent>
    </Card>
  </BackgroundGradient>
);


const BarChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={vis.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)"/>
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <YAxis tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
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
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
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
            <CartesianGrid stroke="rgba(255, 255, 255, 0.2)"/>
            <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
            <Scatter name="Data" data={vis.data} fill="hsl(var(--primary))" />
        </ScatterChart>
    </ResponsiveContainer>
);

const LineChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)"/>
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <YAxis tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
            <Line type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);

const AreaChartRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)"/>
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <YAxis tick={{ fontSize: 12 }} stroke="rgba(255, 255, 255, 0.5)"/>
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
            <Area type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        </AreaChart>
    </ResponsiveContainer>
);

const TreemapRenderer = ({ vis }: { vis: RecommendedVisualization }) => (
    <ResponsiveContainer width="100%" height={300}>
        <Treemap
            data={vis.data}
            dataKey="value" // size of the box
            nameKey="name" // label of the box
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="hsl(var(--primary))"
        >
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
        </Treemap>
    </ResponsiveContainer>
);

const FileUpload = ({ onFileLoaded, children }: { onFileLoaded: (csvData: string, fileName: string) => void, children: React.ReactNode }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File is too large. Please upload a file smaller than 5MB.");
        setFile(null);
        return;
      }
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
        setError("Invalid file type. Please upload a .csv or .xlsx file.");
        setFile(null);
        return;
      }
      
      setError(null);
      setFile(selectedFile);
      
      // Auto-load the file content
      try {
        if (selectedFile.name.endsWith('.xlsx')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const data = event.target?.result;
            if (data) {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
                onFileLoaded(csvOutput, selectedFile.name);
            }
          };
          reader.readAsArrayBuffer(selectedFile);
        } else {
          const fileContent = await selectedFile.text();
          onFileLoaded(fileContent, selectedFile.name);
        }
      } catch (err) {
        setError("Could not read file. Please check if it's corrupted and try again.");
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full">
        <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
            <Card className="bg-transparent border-none shadow-none text-white">
                <CardHeader>
                    <CardTitle>Upload Your Data File</CardTitle>
                    <CardDescription className="text-neutral-400">
                    Select a .csv or .xlsx file from your computer. Max file size: 5MB.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label htmlFor="file-upload" className="flex-1 w-full">
                        <div className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors border-neutral-700">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <FileUp className="h-6 w-6" />
                            <span>{file ? file.name : 'Click to select a file'}</span>
                        </div>
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx" />
                    </label>
                    {children && (
                        <div className="w-full sm:w-auto">
                            {children}
                        </div>
                    )}
                    </div>
                </CardContent>
            </Card>
        </BackgroundGradient>

        <AnimatePresence>
            {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-4">
                <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}


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
      case 'bar':
      case 'histogram': 
        return <BarChartRenderer vis={visualization} />;
      case 'pie': return <PieChartRenderer vis={visualization} />;
      case 'scatter': return <ScatterChartRenderer vis={visualization} />;
      case 'line': return <LineChartRenderer vis={visualization} />;
      case 'area': return <AreaChartRenderer vis={visualization} />;
      case 'treemap': return <TreemapRenderer vis={visualization} />;
      default: return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported chart type: {visualization.chartType}</div>;
    }
  };

  return (
    <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
        <Card ref={chartRef} className="bg-transparent border-none shadow-none text-white">
        <CardHeader className="flex flex-row items-start justify-between">
            <div>
            <CardTitle className="text-lg">{visualization.title}</CardTitle>
            <CardDescription className="mt-1 text-neutral-400">{visualization.caption}</CardDescription>
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
    </BackgroundGradient>
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
    <AppLayout>
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChartIcon className="h-8 w-8 text-primary" />
              Data Analyzer
              <Badge variant="outline">Beta</Badge>
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV or XLSX file to get instant insights, statistics, and AI-recommended visualizations. This feature is in active development.
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
                {result.executiveSummary && (
                   <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
                    <Card className="bg-transparent border-none shadow-none text-white">
                        <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Executive Summary
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-base leading-relaxed text-neutral-300">{result.executiveSummary}</p>
                        </CardContent>
                    </Card>
                  </BackgroundGradient>
                )}
                 <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
                    <Card className="bg-transparent border-none shadow-none text-white">
                    <CardHeader>
                        <CardTitle className="text-xl">Analysis for: {result.fileName}</CardTitle>
                        <CardDescription className="text-neutral-400">
                        Found {result.rowCount} rows and {result.columnCount} columns.
                        </CardDescription>
                    </CardHeader>
                    </Card>
                </BackgroundGradient>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InsightCard title="Key Statistics" stats={result.summaryStats.stats} />
                  <InsightCard title="Missing Values" stats={result.missingValues.stats} />
                  <InsightCard title="Column Types" stats={result.columnTypes.stats} />
                </div>

                {result.correlationAnalysis && (
                  <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
                  <Card className="bg-transparent border-none shadow-none text-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <LineChartIcon className="h-5 w-5" />
                        Correlation Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-neutral-400">{result.correlationAnalysis.interpretation}</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-700 text-sm">
                          <thead className="bg-zinc-800">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium"></th>
                              {result.correlationAnalysis.matrix[0]?.values.map(v => <th key={v.column} className="px-4 py-2 text-center font-medium">{v.column}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-700">
                            {result.correlationAnalysis.matrix.map(row => (
                              <tr key={row.column}>
                                <td className="px-4 py-2 font-medium">{row.column}</td>
                                {row.values.map(v => (
                                  <td key={v.column} className="px-4 py-2 text-center font-mono" style={{ background: `hsla(221, 83%, 53%, ${Math.abs(v.value)})`}}>{v.value.toFixed(2)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                  </BackgroundGradient>
                )}

                {result.segmentationAnalysis && (
                  <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
                    <Card className="bg-transparent border-none shadow-none text-white">
                        <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Segmentation Analysis
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                        <p className="text-neutral-400">{result.segmentationAnalysis.summary}</p>
                            {result.segmentationAnalysis.segments.map((segment, index) => (
                            <div key={index} className="p-3 border rounded-md bg-zinc-800 border-neutral-700">
                                <p className="font-semibold">{segment.name}</p>
                                <p className="text-sm text-neutral-400">{segment.description}</p>
                            </div>
                            ))}
                        </CardContent>
                    </Card>
                 </BackgroundGradient>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {result.recommendedVisualizations.map((vis, index) => (
                    <DynamicChartRenderer key={index} visualization={vis} />
                  ))}
                </div>
                
                <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900">
                <Card className="bg-transparent border-none shadow-none text-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Table className="h-5 w-5" />
                      Column Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {result.columnNames.map(name => (
                        <div key={name} className="p-2 bg-zinc-800 rounded-md text-sm truncate" title={name}>
                          {name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </BackgroundGradient>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </AppLayout>
  )
}
