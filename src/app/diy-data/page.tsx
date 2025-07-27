
'use client';

import { useState, useRef, useCallback, useContext, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bot, Download, History, Loader2, Sparkles, Star, Trash2, Wand2, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie as RechartsPie, Cell, ScatterChart, Scatter, LineChart, Line, AreaChart, Area, Treemap } from 'recharts';
import { toPng } from 'html-to-image';
import { useUser } from '@clerk/nextjs';
import short from 'short-uuid';

import { generateChart, type GenerateChartOutput } from '@/ai/flows/generate-chart';
import { enhanceChartRequest } from '@/ai/flows/enhance-chart-request';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { DataContext, FREE_GENERATIONS_LIMIT } from '@/context/data-context';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';

type VisualizationResult = NonNullable<GenerateChartOutput>;
type HistoryItem = {
  id: string;
  query: string;
  isFavorite?: boolean;
};
type FileHistoryItem = {
  id: string;
  fileName: string;
  csvData: string;
};

const PIE_CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#775DD0"];

const UpgradeCard = () => (
    <Card className="text-center bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">You've Used Your Free Generations!</CardTitle>
        <CardDescription>
          Upgrade to a Pro plan to continue creating custom charts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="lg" asChild>
          <Link href="/pricing">
            <Zap className="mr-2 h-5 w-5" /> Upgrade to Pro
          </Link>
        </Button>
      </CardContent>
    </Card>
);

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

const AreaChartRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
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

const TreemapRenderer = ({ vis }: { vis: VisualizationResult }) => (
    <ResponsiveContainer width="100%" height={350}>
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
      case 'histogram': return <BarChartRenderer vis={visualization} />;
      case 'pie': return <PieChartRenderer vis={visualization} />;
      case 'scatter': return <ScatterChartRenderer vis={visualization} />;
      case 'line': return <LineChartRenderer vis={visualization} />;
      case 'area': return <AreaChartRenderer vis={visualization} />;
      case 'treemap': return <TreemapRenderer vis={visualization} />;
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<VisualizationResult | null>(null);
  const { user } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const { generationCount, setGenerationCount } = useContext(DataContext);
  
  const hasReachedLimit = generationCount !== null && generationCount >= FREE_GENERATIONS_LIMIT;
  
  // Load history from localStorage
  useEffect(() => {
    if (user) {
      try {
        const storedHistory = localStorage.getItem(`diyDataHistory_${user.id}`);
        setHistory(storedHistory ? JSON.parse(storedHistory) : []);
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        setHistory([]);
      }
    }
    setIsHistoryReady(true);
  }, [user]);

  // Save history to localStorage
  useEffect(() => {
    if (user?.id && isHistoryReady) {
      localStorage.setItem(`diyDataHistory_${user.id}`, JSON.stringify(history));
    }
  }, [history, user?.id, isHistoryReady]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
  }, [history]);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    const newHistoryItem = { id: short.generate(), query, isFavorite: false };
    setHistory(prev => [newHistoryItem, ...prev.filter(item => item.query !== query)]);
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };
  
  const toggleFavorite = (id: string) => {
    setHistory(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const clearHistory = () => {
    setHistory([]);
    if (user?.id) {
        localStorage.removeItem(`diyDataHistory_${user.id}`);
    }
  };


  const getColumnNames = (): string[] => {
    if (!csvData) return [];
    const lines = csvData.trim().split('\n');
    if (lines.length === 0) return [];
    return lines[0].split(',').map(name => name.trim());
  };

  const handleEnhanceRequest = async () => {
    if (!request.trim() || hasReachedLimit) return;

    setIsEnhancing(true);
    setError(null);
    try {
        const columnNames = getColumnNames();
        const { enhancedRequest } = await enhanceChartRequest({ request, columnNames });
        setRequest(enhancedRequest);
        setGenerationCount(prev => (prev !== null ? prev + 1 : 1));
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
    if (hasReachedLimit) return;


    setIsLoading(true);
    setError(null);
    setChart(null);

    try {
      const output = await generateChart({ csvData, request });
      if (output) {
        setChart(output);
        addToHistory(request);
        setGenerationCount(prev => (prev !== null ? prev + 1 : 1));
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
    <>
    <AppSidebar>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <History />
            History
          </SidebarGroupLabel>
          {isHistoryReady && history.length > 0 && (
            <SidebarGroupAction asChild>
              <button onClick={clearHistory} title="Clear history">
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
            ) : sortedHistory.length > 0 ? (
              sortedHistory.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    className="h-auto py-1 pr-12"
                    onClick={() => setRequest(item.query)}
                    tooltip={{ children: item.query, side: "right", align: "center" }}
                  >
                    <span className="truncate">{item.query}</span>
                  </SidebarMenuButton>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <SidebarMenuAction
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      showOnHover
                      title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star className={item.isFavorite ? "text-yellow-400 fill-yellow-400" : ""} />
                    </SidebarMenuAction>
                    <SidebarMenuAction
                      onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id); }}
                      showOnHover
                      title="Delete item"
                    >
                      <Trash2 />
                    </SidebarMenuAction>
                  </div>
                </SidebarMenuItem>
              ))
            ) : (
              <p className="px-2 text-xs text-muted-foreground">No history yet.</p>
            )}
          </SidebarMenu>
        </SidebarGroup>
    </AppSidebar>

    <div className="space-y-6">
      <AnimatePresence mode="wait">
      {hasReachedLimit ? (
        <motion.div key="upgrade-card">
            <UpgradeCard />
        </motion.div>
      ) : (
        <motion.div key="form-card">
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
                    placeholder="e.g., 'Show me an area chart of sales over time' or 'a treemap of market cap by company'"
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isLoading || isEnhancing || hasReachedLimit}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleEnhanceRequest} disabled={!request.trim() || isLoading || isEnhancing || hasReachedLimit}>
                        {isEnhancing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enhancing...
                        </>
                        ) : (
                        <>
                            <Bot className="mr-2 h-4 w-4" /> Enhance
                        </>
                        )}
                    </Button>
                    <Button type="submit" disabled={!request.trim() || isLoading || isEnhancing || hasReachedLimit}>
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
        </motion.div>
        )}
      </AnimatePresence>
      
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
    </>
  );
};

const DIYDataPageContent = () => {
    const { csvData, fileName, setCsvData, setFileName, setFileHistory, isContextReady } = useContext(DataContext);
    const { user } = useUser();
  
    const handleFileLoaded = (data: string, name: string) => {
      setCsvData(data);
      setFileName(name);
      
      // Also add to the global file history
      if (user?.id) {
        const newHistoryItem: FileHistoryItem = { id: short.generate(), fileName: name, csvData: data };
        setFileHistory(prev => [newHistoryItem, ...prev.filter(item => item.fileName !== name)]);
      }
    };
  
    return (
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wand2 className="h-8 w-8 text-primary" />
              DIY with Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV or XLSX file and use plain English to generate the exact charts you need.
            </p>
          </header>
  
          <AnimatePresence mode="wait">
            {!isContextReady ? (
                <motion.div key="loading">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                </motion.div>
            ) : csvData && fileName ? (
                <motion.div key="diy-interface" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <DIYInterface csvData={csvData} fileName={fileName} />
                </motion.div>
             ) : (
                 <motion.div key="upload-form" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     <FileUpload onFileLoaded={handleFileLoaded}>
                        {/* No action button needed here as loading the file is the action */}
                    </FileUpload>
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>No Data Loaded</AlertTitle>
                        <AlertDescription>
                            Please upload a file to start creating charts, or analyze a file first on the{' '}
                            <Button variant="link" asChild className="p-0 h-auto"><Link href="/data-analyzer">Data Analyzer</Link></Button> page.
                        </AlertDescription>
                    </Alert>
                 </motion.div>
             )}
          </AnimatePresence>
        </div>
      </main>
    );
};
  
export default function DIYDataPage() {
    return (
      <DIYDataPageContent />
    );
}

    