
'use client';

import { useState, ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, FileUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FileUploadProps {
    onFileLoaded: (csvData: string, fileName: string) => void;
    children?: React.ReactNode;
}

export function FileUpload({ onFileLoaded, children }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
      
      // Auto-load the file content
      try {
        const fileContent = await selectedFile.text();
        onFileLoaded(fileContent, selectedFile.name);
      } catch (err) {
        setError("Could not read file. Please check if it's corrupted and try again.");
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full">
        <Card>
        <CardHeader>
            <CardTitle>Upload Your Data File</CardTitle>
            <CardDescription>
            Select a .csv file from your computer. Max file size: 1MB.
            </CardDescription>
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
            {children && (
                <div className="w-full sm:w-auto">
                    {children}
                </div>
            )}
            </div>
        </CardContent>
        </Card>

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
