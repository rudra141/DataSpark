
'use client';

import { useState, ChangeEvent, useContext } from 'react';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import * as XLSX from 'xlsx';
import { Skeleton } from './ui/skeleton';

interface FileUploadProps {
    onFileLoaded: (csvData: string, fileName: string) => void;
    children?: React.ReactNode;
}

export function FileUpload({ onFileLoaded, children }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded: isUserLoaded } = useUser();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 1 * 1024 * 1024) { // 1MB limit
        setError("File is too large. Please upload a file smaller than 1MB.");
        setFile(null);
        return;
      }
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileType !== 'csv' && fileType !== 'xlsx') {
        setError("Invalid file type. Please upload a .csv or .xlsx file.");
        setFile(null);
        return;
      }
      
      setError(null);
      setFile(selectedFile);
      handleLoadFile(selectedFile); // Auto-load the file
    }
  };
  
  const handleLoadFile = async (fileToLoad: File) => {
      if (!fileToLoad) {
          setError("Please select a file.");
          return;
      }
      setIsLoading(true);
      setError(null);
      
      try {
        const fileType = fileToLoad.name.split('.').pop()?.toLowerCase();
        let fileContent: string;

        if (fileType === 'xlsx') {
          const data = await fileToLoad.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          fileContent = XLSX.utils.sheet_to_csv(worksheet);
        } else {
          fileContent = await fileToLoad.text();
        }
        onFileLoaded(fileContent, fileToLoad.name);
      } catch (err) {
          setError("Could not read file. Please check if it's corrupted and try again.");
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }

  const isReady = isUserLoaded;

  return (
    <div className="w-full">
        {!isReady ? (
            <Card>
            <CardHeader>
                <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
            </Card>
        ) : (
            <Card>
            <CardHeader>
                <CardTitle>Upload Your Data File</CardTitle>
                <CardDescription>
                Select a .csv or .xlsx file from your computer. Max file size: 1MB.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                <label htmlFor="file-upload" className="flex-1 w-full">
                    <div className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <FileUp className="h-6 w-6" />
                            <span>{file ? file.name : 'Click to select a file'}</span>
                        </div>
                    )}
                    </div>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv,.xlsx" disabled={isLoading}/>
                </label>
                {children && (
                    <div className="w-full sm:w-auto">
                        {children}
                    </div>
                )}
                </div>
            </CardContent>
            </Card>
        )}

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
