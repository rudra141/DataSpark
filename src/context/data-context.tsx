
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export const FREE_GENERATIONS_LIMIT = 100;

type FileHistoryItem = {
  id: string;
  fileName: string;
  csvData: string;
};

interface DataContextProps {
  csvData: string | null;
  setCsvData: (data: string | null) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
  fileHistory: FileHistoryItem[];
  setFileHistory: React.Dispatch<React.SetStateAction<FileHistoryItem[]>>;
  isHistoryReady: boolean;
  generationCount: number | null;
  setGenerationCount: React.Dispatch<React.SetStateAction<number | null>>;
  isContextReady: boolean;
}

export const DataContext = createContext<DataContextProps>({
  csvData: null,
  setCsvData: () => {},
  fileName: null,
  setFileName: () => {},
  fileHistory: [],
  setFileHistory: () => {},
  isHistoryReady: false,
  generationCount: null,
  setGenerationCount: () => {},
  isContextReady: false,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistoryItem[]>([]);
  const [generationCount, setGenerationCount] = useState<number | null>(null);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const [isContextReady, setIsContextReady] = useState(false);

  const { user, isLoaded: isUserLoaded } = useUser();

  // Load all user-specific data from localStorage
  useEffect(() => {
    if (isUserLoaded) {
      if (user) {
        try {
          const storedHistory = localStorage.getItem(`fileHistory_${user.id}`);
          setFileHistory(storedHistory ? JSON.parse(storedHistory) : []);

          const storedCount = localStorage.getItem(`generationCount_${user.id}`);
          setGenerationCount(storedCount ? parseInt(storedCount, 10) : 0);

        } catch (e) {
          console.error("Failed to parse data from localStorage", e);
          setFileHistory([]);
          setGenerationCount(0);
        }
      } else {
        // Handle logged out state
        setFileHistory([]);
        setGenerationCount(0);
      }
      setIsHistoryReady(true);
      setIsContextReady(true);
    }
  }, [isUserLoaded, user]);

  // Save all user-specific data to localStorage when it changes
  useEffect(() => {
    if (user?.id && isContextReady) {
      // Save file history
      const limitedHistory = fileHistory.slice(0, 50);
      localStorage.setItem(`fileHistory_${user.id}`, JSON.stringify(limitedHistory));

      // Save generation count
      if (generationCount !== null) {
        localStorage.setItem(`generationCount_${user.id}`, generationCount.toString());
      }
    }
  }, [fileHistory, generationCount, user?.id, isContextReady]);

  return (
    <DataContext.Provider value={{ 
        csvData, setCsvData, 
        fileName, setFileName, 
        fileHistory, setFileHistory, 
        isHistoryReady,
        generationCount, setGenerationCount,
        isContextReady,
    }}>
      {children}
    </DataContext.Provider>
  );
};

    