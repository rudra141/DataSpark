
"use client";

import { useState } from "react";
import { generateFormula, type GenerateFormulaOutput } from "@/ai/flows/generate-formula";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Bot, AlertTriangle } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { AppSidebar } from "@/components/app-sidebar";

export default function FormulaPage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<GenerateFormulaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex w-full">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-4xl p-4 sm:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Calculator className="h-8 w-8 text-primary" />
                        Formula Generator
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Describe any calculation in plain English. Our AI generates the precise, ready-to-use formula for Excel and Google Sheets.
                    </p>
                </header>
                
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Describe Your Calculation</CardTitle>
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
                                    <Button type="button" size="sm" variant="ghost" onClick={handleEnhancePrompt} disabled={isEnhancing || isLoading}>
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
                </form>

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
        </div>
      </main>
    </div>
  );
}
