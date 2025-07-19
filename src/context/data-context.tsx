
'use client';

import React, { createContext, useState, ReactNode } from 'react';

interface DataContextProps {
  csvData: string | null;
  setCsvData: (data: string | null) => void;
  fileName: string | null;
  setFileName: (name: string | null) => void;
}

export const DataContext = createContext<DataContextProps>({
  csvData: null,
  setCsvData: () => {},
  fileName: null,
  setFileName: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <DataContext.Provider value={{ csvData, setCsvData, fileName, setFileName }}>
      {children}
    </DataContext.Provider>
  );
};
