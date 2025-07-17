
"use client";

import { useState, useEffect } from "react";
import { generateFormula, type GenerateFormulaOutput } from "@/ai/flows/generate-formula";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, Terminal, Lightbulb, Bot, FileText, BookCopy, Crown, Zap } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const MAX_FREE_GENERATIONS = 3;

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function FormulaPage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<GenerateFormulaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generationCount, setGenerationCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    const storedCount = localStorage.getItem("generationCount");
    const storedProStatus = localStorage.getItem("isPro");

    setGenerationCount(storedCount ? parseInt(storedCount, 10) : 0);
    setIsPro(storedProStatus === "true");
  }, []);

  const hasGenerationsLeft = isPro || generationCount < MAX_FREE_GENERATIONS;

  const handleEnhancePrompt = async () => {
    if (!description.trim() || !hasGenerationsLeft) return;
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

  const handleGenerateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
     if (!hasGenerationsLeft) {
      e.preventDefault();
      setShowUpgradeDialog(true);
    }
  }

  const handleUpgrade = () => {
    setIsPro(true);
    localStorage.setItem("isPro", "true");
    setShowUpgradeDialog(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description to generate a formula.");
      return;
    }
    
    if (!hasGenerationsLeft) {
      setShowUpgradeDialog(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const output = await generateFormula({ description });
      setResult(output);
       if (!isPro) {
        const newCount = generationCount + 1;
        setGenerationCount(newCount);
        localStorage.setItem("generationCount", newCount.toString());
      }
    } catch (err: any) {
      setError("An error occurred while generating the formula. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultSkeletons = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Card className="w-full">
        <CardHeader>
           <Skeleton className="h-10 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <div className="min-h-screen bg-muted/20">
        <main className="grid flex-1 grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar */}
          <aside className="hidden md:flex flex-col gap-4 border-r bg-background p-4">
              <h2 className="font-headline text-xl font-semibold flex items-center gap-2">
                  <Wand2 className="text-primary"/>
                  Generator
              </h2>
              <Separator />

              <div className="flex-1 space-y-4">
                {/* Usage Card */}
                 <Card className="bg-card/50">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                          <span>Usage</span>
                          {isPro ? (
                            <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                              <Crown className="mr-1 h-3 w-3" /> Pro
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free Plan</Badge>
                          )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-center">
                         {isPro ? (
                            <p className="text-2xl font-bold text-green-400">Unlimited</p>
                          ) : (
                            <p className="text-2xl font-bold">
                              {MAX_FREE_GENERATIONS - generationCount}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">Generations Left</p>
                      </div>
                    </CardContent>
                    {!isPro && (
                       <CardFooter className="p-2 pt-0">
                          <Button size="sm" className="w-full" onClick={() => setShowUpgradeDialog(true)}>
                            <Crown className="mr-2 h-4 w-4"/> Upgrade
                          </Button>
                      </CardFooter>
                    )}
                 </Card>

                {/* History */}
                <h3 className="text-sm font-medium text-muted-foreground">History</h3>
                <div className="text-center text-sm text-muted-foreground/60 p-4 border border-dashed rounded-lg flex-1">
                    Your past generations will appear here.
                </div>
              </div>
              <p className="text-xs text-muted-foreground/50 text-center">© {new Date().getFullYear()} FormulaFlow</p>
          </aside>

          {/* Main Content */}
          <div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-6">
              <form onSubmit={handleSubmit}>
                  <Card className="shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/60">
                      <CardHeader>
                          <CardTitle className="font-headline text-2xl">Describe Your Calculation</CardTitle>
                          <CardDescription>
                            Enter a plain English description of what you want to calculate. Be specific for the best results!
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <Textarea
                          placeholder="e.g., 'Sum of column A if column B is 'Completed' and column C is after today'"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-[140px] text-base focus:ring-primary bg-background/50 font-body"
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
                                <Button type="button" size="sm" variant="ghost" onClick={handleEnhancePrompt} disabled={isEnhancing || !hasGenerationsLeft}>
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
                          className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                          onClick={handleGenerateClick}
                        >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                {hasGenerationsLeft ? (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" /> Generate Formulas
                                  </>
                                ) : (
                                  <>
                                    <Crown className="mr-2 h-4 w-4" /> Upgrade to Pro
                                  </>
                                )}
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
                              <Terminal className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{error}</AlertDescription>
                          </Alert>
                      </motion.div>
                  )}
              </AnimatePresence>
              
              <div className="flex-1">
                  <AnimatePresence mode="wait">
                      {isLoading && <ResultSkeletons key="skeleton" />}
                      {result && !isLoading && (
                          <motion.div
                            key="result"
                            className="space-y-8"
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={containerVariants}
                          >
                            <Tabs defaultValue="excel" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 max-w-md">
                                  <TabsTrigger value="excel">
                                    <BookCopy className="mr-2 h-4 w-4" />
                                    Excel
                                  </TabsTrigger>
                                  <TabsTrigger value="google-sheets">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    Google Sheets
                                  </TabsTrigger>
                                  <TabsTrigger value="explanation">
                                    <Lightbulb className="mr-2 h-4 w-4" />
                                    Explanation
                                    </TabsTrigger>
                                </TabsList>
                                <motion.div variants={itemVariants}>
                                  <TabsContent value="excel">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="font-headline text-xl">Excel Formula</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            id="excel-formula"
                                            value={result.excelFormula}
                                            readOnly
                                            className="font-code text-base bg-muted"
                                          />
                                          <CopyButton textToCopy={result.excelFormula} />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  <TabsContent value="google-sheets">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="font-headline text-xl">Google Sheets Formula</CardTitle>
                                      </Header>
                                      <CardContent>
                                        <div className="flex items-center space-x-2">
                                          <Input
                                            id="gsheets-formula"
                                            value={result.googleSheetsFormula}
                                            readOnly
                                            className="font-code text-base bg-muted"
                                          />
                                          <CopyButton textToCopy={result.googleSheetsFormula} />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                  <TabsContent value="explanation">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="font-headline text-xl">Formula Breakdown</CardTitle>
                                        <CardDescription>A step-by-step guide to how the formulas work.</CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                                          {result.explanation}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </TabsContent>
                                </motion.div>
                              </Tabs>
                          </motion.div>
                      )}
                      {!isLoading && !result && (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/20 text-center p-8"
                          >
                              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
                              <h3 className="text-xl font-semibold text-muted-foreground">Your results will appear here</h3>
                              <p className="text-muted-foreground/70 mt-1">Describe your calculation above and click "Generate" to get started.</p>
                        </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
        </main>
      </div>
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="text-yellow-400" />
              Upgrade to FormulaFlow Pro
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've used all your free generations. Upgrade to our Pro plan for unlimited formula generations and access to all features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">Unlimited access.</p>
                </div>
                 <p className="text-2xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </div>
            </CardContent>
          </Card>
          <AlertDialogFooter>
            <AlertDialogCancel>Maybe Later</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpgrade} className="bg-green-600 hover:bg-green-700 text-white">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
