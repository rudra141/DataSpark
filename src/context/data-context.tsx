
'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

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
}

export const DataContext = createContext<DataContextProps>({
  csvData: null,
  setCsvData: () => {},
  fileName: null,
  setFileName: () => {},
  fileHistory: [],
  setFileHistory: () => {},
  isHistoryReady: false,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileHistory, setFileHistory] = useState<FileHistoryItem[]>([]);
  const [isHistoryReady, setIsHistoryReady] = useState(false);
  const { user } = useUser();

  // Load history from localStorage when user is available
  useEffect(() => {
    if (user) {
      try {
        const storedHistory = localStorage.getItem(`fileHistory_${user.id}`);
        if (storedHistory) {
          setFileHistory(JSON.parse(storedHistory));
        }
      } catch (e) {
        console.error("Failed to parse file history from localStorage", e);
        setFileHistory([]);
      } finally {
        setIsHistoryReady(true);
      }
    } else {
        // If no user, ensure history is cleared and ready state is set
        setFileHistory([]);
        setIsHistoryReady(true);
    }
  }, [user]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (user?.id && isHistoryReady) {
      // Limit history size to prevent localStorage from blowing up
      const limitedHistory = fileHistory.slice(0, 50);
      localStorage.setItem(`fileHistory_${user.id}`, JSON.stringify(limitedHistory));
    }
  }, [fileHistory, user?.id, isHistoryReady]);

  return (
    <DataContext.Provider value={{ csvData, setCsvData, fileName, setFileName, fileHistory, setFileHistory, isHistoryReady }}>
      {children}
    </DataContext.Provider>
  );
};

    