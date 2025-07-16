"use client";

import { useState } from "react";
import { generateFormula, type GenerateFormulaOutput } from "@/ai/flows/generate-formula";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, Terminal } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<GenerateFormulaOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError("An error occurred while generating the formula. Please check your connection or try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const ResultSkeletons = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
           <Skeleton className="h-6 w-28" />
        </CardHeader>
        <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[85%]" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-12">
        <header className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary">
            FormulaFlow
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Instantly translate your thoughts into Excel and Google Sheets formulas with AI.
          </p>
        </header>

        <Card className="shadow-lg overflow-hidden">
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
            <CardContent>
              <Textarea
                placeholder="e.g., 'Sum of column A if column B is 'Completed' and column C is after today'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] text-base focus:ring-accent"
                required
              />
            </CardContent>
            <CardFooter className="bg-muted/50 px-6 py-4">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto ml-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Formula
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {isLoading && <ResultSkeletons />}
        
        {result && (
          <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Excel Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="excel-formula"
                      value={result.excelFormula}
                      readOnly
                      className="font-code text-sm"
                    />
                    <CopyButton textToCopy={result.excelFormula} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Google Sheets Formula</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center space-x-2">
                    <Input
                      id="gsheets-formula"
                      value={result.googleSheetsFormula}
                      readOnly
                      className="font-code text-sm"
                    />
                    <CopyButton textToCopy={result.googleSheetsFormula} />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {result.explanation}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
