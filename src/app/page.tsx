"use client";

import { useState, useRef } from "react";
import { generateFormula, type GenerateFormulaOutput } from "@/ai/flows/generate-formula";
import { explainFormula } from "@/ai/flows/explain-formula";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, Terminal, Lightbulb, Bot, ArrowDown } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

type FormulaType = "Excel" | "Google Sheets";

export default function Home() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<GenerateFormulaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isExplaining, setIsExplaining] = useState<FormulaType | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEnhancePrompt = async () => {
    if (!description.trim()) return;
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

  const handleExplainFormula = async (formulaType: FormulaType) => {
    if (!result) return;
    const formula = formulaType === "Excel" ? result.excelFormula : result.googleSheetsFormula;
    
    // If already explaining this one, hide it.
    if (isExplaining === formulaType) {
      setIsExplaining(null);
      setExplanation(null);
      return;
    }

    setIsExplaining(formulaType);
    setExplanation(null); // Clear previous explanation
    setError(null);

    try {
      const { explanation } = await explainFormula({ formula, formulaType });
      setExplanation(explanation);
    } catch (err) {
      setError(`An error occurred while explaining the ${formulaType} formula.`);
      console.error(err);
    } finally {
      // Keep loading state until explanation is set, but this logic is now handled by the presence of `explanation` state.
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
    setExplanation(null);
    setIsExplaining(null);

    try {
      const output = await generateFormula({ description });
      setResult(output);
    } catch (err) {
      setError("An error occurred while generating the formula. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const ResultSkeletons = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-background">
       <main className="container mx-auto flex flex-col items-center p-4 sm:p-8">
         <div className="w-full max-w-4xl space-y-12">
           <section className="text-center min-h-[calc(100vh-200px)] flex flex-col justify-center items-center">
             <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-fuchsia-500 to-orange-400">
               Convert English to Excel Formulas Instantly
             </h1>
             <p className="mt-6 text-xl text-muted-foreground">
               Stop Googling. Start Copy-Pasting.
             </p>
             <Button size="lg" className="mt-10 animate-pulse" onClick={handleScrollToForm}>
               Try It Free <ArrowDown className="ml-2 h-5 w-5"/>
             </Button>
           </section>

          <div ref={formRef} className="scroll-mt-20">
            <Card className="shadow-2xl shadow-primary/10 overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                    <Wand2 className="h-6 w-6 text-accent" />
                    Describe Your Calculation
                  </CardTitle>
                  <CardDescription>
                    Enter a plain English description of what you want to calculate. The more specific, the better!
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <Textarea
                    placeholder="e.g., 'Sum of column A if column B is 'Completed' and column C is after today'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] text-base focus:ring-accent bg-background/50"
                    required
                  />
                   <AnimatePresence>
                    {description.trim().length > 10 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 right-4"
                      >
                        <Button type="button" size="sm" variant="ghost" onClick={handleEnhancePrompt} disabled={isEnhancing}>
                          {isEnhancing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Bot className="mr-2 h-4 w-4" />
                          )}
                          Enhance Prompt
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4">
                  <Button type="submit" disabled={isLoading || isEnhancing} className="w-full sm:w-auto ml-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? "Generating..." : "Generate Formula"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

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

          {isLoading && <ResultSkeletons />}
          
          <AnimatePresence>
            {result && (
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(["Excel", "Google Sheets"] as const).map((type) => (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="font-headline flex items-center justify-between">
                          {type} Formula
                          <Badge variant="secondary">{type === "Excel" ? "XLSX" : "G-Sheet"}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`${type}-formula`}
                            value={type === "Excel" ? result.excelFormula : result.googleSheetsFormula}
                            readOnly
                            className="font-code text-sm"
                          />
                          <CopyButton textToCopy={type === "Excel" ? result.excelFormula : result.googleSheetsFormula} />
                        </div>
                      </CardContent>
                      <CardFooter>
                         <Button variant="outline" size="sm" onClick={() => handleExplainFormula(type)} disabled={isExplaining === type && !explanation}>
                           {isExplaining === type && !explanation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                           {isExplaining === type ? 'Hide Explanation' : 'Explain Formula'}
                         </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                 
                <AnimatePresence>
                  {isExplaining && explanation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-headline flex items-center gap-2">
                             <Lightbulb className="text-accent"/>
                            Formula Explanation ({isExplaining})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-invert prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                            {explanation}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                 </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
