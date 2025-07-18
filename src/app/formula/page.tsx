"use client";

import { useState, useEffect, useMemo } from "react";
import { generateFormula, type GenerateFormulaOutput } from "@/ai/flows/generate-formula";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Bot, History, Trash2, Star } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarGroupAction,
} from "@/components/ui/sidebar";
import short from "short-uuid";

type HistoryItem = {
  id: string;
  query: string;
  isFavorite?: boolean;
};

export default function FormulaPage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<GenerateFormulaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem("formulaHistory");
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("formulaHistory", JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

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
  };

  const handleEnhancePrompt = async () => {
    if (!description) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const { enhancedDescription } = await enhancePrompt({ description });
      setDescription(enhancedDescription);
    } catch (err) {
      setError("An error occurred while enhancing the prompt.");
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description to generate a formula.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const output = await generateFormula({ description });
      setResult(output);
      addToHistory(description);
    } catch (err: any) {
      setError("An error occurred while generating the formula. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultSkeletons = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
              <div className="font-headline text-lg font-bold text-primary">FormulaFlow</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <History />
              History
            </SidebarGroupLabel>
            {history.length > 0 && (
              <SidebarGroupAction asChild>
                <button onClick={clearHistory} title="Clear history">
                  <Trash2 />
                </button>
              </SidebarGroupAction>
            )}
            <SidebarMenu>
              {sortedHistory.length > 0 ? (
                sortedHistory.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className="h-auto py-1 pr-12"
                      onClick={() => setDescription(item.query)}
                      tooltip={{
                        children: item.query,
                        side: "right",
                        align: "center",
                      }}
                    >
                      <span className="truncate">{item.query}</span>
                    </SidebarMenuButton>
                     <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <SidebarMenuAction
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        showOnHover
                        title={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star className={item.isFavorite ? "text-yellow-400 fill-yellow-400" : ""} />
                      </SidebarMenuAction>
                      <SidebarMenuAction
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id);
                        }}
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
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
         <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
               <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold">Formula Generator</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Describe Your Calculation</CardTitle>
                        <CardDescription>
                          Enter a plain English description of what you want to calculate. Be as specific as possible for the best results.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <Textarea
                        placeholder="e.g., 'Sum of column A if column B is 'Completed' and column C is after today'"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[120px] text-base"
                        required
                        />
                         <AnimatePresence>
                          {description.trim().length > 10 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-5 right-5"
                            >
                              <Button type="button" size="sm" variant="ghost" onClick={handleEnhancePrompt} disabled={isEnhancing}>
                                {isEnhancing ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Bot className="mr-2 h-4 w-4" />
                                )}
                                Enhance
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isLoading || isEnhancing}
                        className="w-full sm:w-auto ml-auto"
                      >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" /> Generate Formula
                            </>
                          )}
                        </Button>
                    </CardFooter>
                </Card>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <Alert variant="destructive">
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {isLoading && <ResultSkeletons key="skeleton" />}

                  {result && !isLoading && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle>Excel Formula</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="excel-formula"
                              value={result.excelFormula}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <CopyButton textToCopy={result.excelFormula} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Google Sheets Formula</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2">
                             <Input
                              id="gsheets-formula"
                              value={result.googleSheetsFormula}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <CopyButton textToCopy={result.googleSheetsFormula} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Explanation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p>{result.explanation}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
