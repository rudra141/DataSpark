
'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart as BarChartIcon, FileUp, Loader2, Sparkles, Wand2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { toPng } from 'html-to-image';

import { generateChart, type GenerateChartOutput } from '@/ai/flows/generate-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Textarea } from '@/components/ui/textarea';

type VisualizationResult = NonNullable<GenerateChartOutput>;

// Chart Rendering Components (reused from data-analyzer page for consistency)
const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

const BarChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
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

const PieChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
        <RechartsPieChart>
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <RechartsPie data={vis.data} dataKey={vis.config.dataKey} nameKey={vis.config.indexKey} cx="50%" cy="50%" outerRadius={100} label>
                {vis.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                ))}
            </RechartsPie>
        </RechartsPieChart>
    </ResponsiveContainer>
);

const ScatterChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name={vis.config.xAxisLabel || 'x'} tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -10 }} />
            <YAxis type="number" dataKey="y" name={vis.config.yAxisLabel || 'y'} tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Scatter name="Data" data={vis.data} fill="hsl(var(--primary))" />
        </ScatterChart>
    </ResponsiveContainer>
);

const LineChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
        <LineChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} angle={-30} textAnchor="end" height={60} interval="preserveStartEnd" tick={{ fontSize: 12 }} label={{ value: vis.config.xAxisLabel, position: 'insideBottom', offset: -15 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: vis.config.yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ stroke: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Line type="monotone" dataKey={vis.config.dataKey} stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
        </LineChart>
    </ResponsiveContainer>
);

const DynamicChartRenderer = ({ visualization }: { visualization: VisualizationResult }) => {
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
      default: return <div className="flex items-center justify-center h-full text-muted-foreground">Unsupported chart type.</div>;
    }
  };

  return (
    <Card ref={chartRef} className="bg-card">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg">{visualization.title}</CardTitle>
          <CardDescription className="mt-1">{visualization.caption}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 ml-4">
          <Download className="h-4 w-4" />
          <span className="sr-only">Download Chart</span>
        </Button>
      </CardHeader>
      <CardContent>
          <div className="h-[24rem] w-full">
            {renderChart()}
          </div>
      </CardContent>
    </Card>
  );
};

const DIYInterface = ({ csvData, fileName }: { csvData: string; fileName: string }) => {
  const [request, setRequest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<VisualizationResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) {
      setError("Please enter a description for the chart you want to create.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setChart(null);

    try {
      const output = await generateChart({ csvData, request });
      if (output) {
        setChart(output);
      } else {
        // This is a specific, user-friendly message for when the AI can't fulfill the request.
        setError("Sorry, I couldn't generate a chart from that request. Please try rephrasing it, or check if the data supports it.");
      }
    } catch (err) {
      console.error(err);
      // This is for unexpected system errors.
      setError("An unexpected error occurred while generating the chart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6" />
            Create a Custom Visualization
          </CardTitle>
          <CardDescription>
            File loaded: <strong>{fileName}</strong>. Describe the chart you want to create in plain English.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., 'Show me a bar chart of the average salary by department' or 'A scatter plot of age vs. income'"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!request.trim() || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Chart
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Generation Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {isLoading && (
            <motion.div key="skeleton" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-80 w-full" />
                    </CardContent>
                </Card>
            </motion.div>
        )}
        {chart && !isLoading && (
          <motion.div key="chart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <DynamicChartRenderer visualization={chart} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function DIYDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded: isUserLoaded } = useUser();

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
      setCsvData(null);
    }
  };
  
  const handleLoadFile = async () => {
      if (!file) {
          setError("Please select a file first.");
          return;
      }
      setIsLoading(true);
      setError(null);
      
      try {
          const fileContent = await file.text();
          setCsvData(fileContent);
      } catch (err) {
          setError("Could not read file. Please try again.");
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }

  const isReady = isUserLoaded;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wand2 className="h-8 w-8 text-primary" />
              DIY with Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV file and use plain English to generate the exact charts you need.
            </p>
          </header>

          <AnimatePresence mode="wait">
             {csvData && file ? (
                <motion.div key="diy-interface" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <DIYInterface csvData={csvData} fileName={file.name} />
                </motion.div>
             ) : (
                 <motion.div key="upload-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     {!isReady ? (
                      <Card>
                        <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                      </Card>
                    ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle>Upload Your Data File</CardTitle>
                            <CardDescription>Select a .csv file from your computer to begin.</CardDescription>
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
                              <Button onClick={handleLoadFile} disabled={!file || isLoading} className="w-full sm:w-auto">
                                {isLoading ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                                ) : (
                                  <><Sparkles className="mr-2 h-4 w-4" /> Start DIY Session</>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    )}
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
        </div>
      </main>
    </SidebarProvider>
  );
}
