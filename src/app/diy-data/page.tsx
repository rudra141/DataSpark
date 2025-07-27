
'use client';

import { useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Download, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line } from 'recharts';
import { toPng } from 'html-to-image';

import { generateChart, type GenerateChartOutput } from '@/ai/flows/generate-chart';
import { enhanceChartRequest } from '@/ai/flows/enhance-chart-request';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/app-sidebar';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/file-upload';

type VisualizationResult = NonNullable<GenerateChartOutput>;

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

const BarChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
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
            <XAxis type="number" dataKey="x" name="x" tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey="y" name="y" tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
            <Scatter name="Data" data={vis.data} fill="hsl(var(--primary))" />
        </ScatterChart>
    </ResponsiveContainer>
);

const LineChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
        <LineChart data={vis.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={vis.config.indexKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
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
    <Card ref={chartRef}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<VisualizationResult | null>(null);

  const getColumnNames = (): string[] => {
    if (!csvData) return [];
    const lines = csvData.trim().split('\n');
    if (lines.length === 0) return [];
    return lines[0].split(',').map(name => name.trim());
  };

  const handleEnhanceRequest = async () => {
    if (!request.trim()) return;

    setIsEnhancing(true);
    setError(null);
    try {
        const columnNames = getColumnNames();
        const { enhancedRequest } = await enhanceChartRequest({ request, columnNames });
        setRequest(enhancedRequest);
    } catch (err) {
        console.error(err);
        setError("Could not enhance the request. Please try rephrasing.");
    } finally {
        setIsEnhancing(false);
    }
  };

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
        setError("Sorry, I couldn't generate a chart from that request. Please try rephrasing it, or check if the data supports it.");
      }
    } catch (err) {
      console.error(err);
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
                File loaded: <strong>{fileName}</strong>. Describe the chart you want to create, or use the Enhance button to let AI refine your idea.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                    placeholder="e.g., 'Show me an area chart of sales over time' or 'a pie chart of sales by region'"
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isLoading || isEnhancing}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleEnhanceRequest} disabled={!request.trim() || isLoading || isEnhancing}>
                        {isEnhancing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enhancing...
                        </>
                        ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" /> Enhance
                        </>
                        )}
                    </Button>
                    <Button type="submit" disabled={!request.trim() || isLoading || isEnhancing}>
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
    const [csvData, setCsvData] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
  
    const handleFileLoaded = (data: string, name: string) => {
      setCsvData(data);
      setFileName(name);
    };
  
    return (
        <>
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
                    {csvData && fileName ? (
                        <motion.div key="diy-interface" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <DIYInterface csvData={csvData} fileName={fileName} />
                        </motion.div>
                    ) : (
                        <motion.div key="upload-form" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <FileUpload onFileLoaded={handleFileLoaded}>
                                {/* No action button needed here as loading the file is the action */}
                            </FileUpload>
                             <Alert className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>No Data Loaded</AlertTitle>
                                <AlertDescription>
                                    Please upload a file to start creating charts, or analyze a file first on the Data Analyzer page.
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </main>
        </>
    );
}
