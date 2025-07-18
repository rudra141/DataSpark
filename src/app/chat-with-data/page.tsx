
'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bot, FileUp, Loader2, Send, Sparkles } from 'lucide-react';
import { chatWithData, type ChatMessage } from '@/ai/flows/chat-with-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatInterface = ({ csvData, fileName }: { csvData: string, fileName: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    setMessages([{role: 'model', content: `File loaded: **${fileName}**. What would you like to know about it?`}]);
  }, [fileName]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsChatting(true);
    const userMessage: ChatMessage = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');

    try {
      const chatResult = await chatWithData({
        csvData,
        question,
        history: messages.slice(-4), // Send last 4 messages for context
      });
      const modelMessage: ChatMessage = { role: 'model', content: chatResult.answer };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Chat with Your Data
        </CardTitle>
        <CardDescription>
          Ask questions in natural language to get specific insights from your file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh] w-full pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 text-sm ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'model' && <Bot className="h-6 w-6 shrink-0 text-primary" />}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}} />
                </div>
              </div>
            ))}
            {isChatting && (
                <div className="flex gap-3 justify-start">
                    <Bot className="h-6 w-6 shrink-0 text-primary" />
                    <div className="rounded-lg px-4 py-2 text-sm bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Thinking...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleChatSubmit} className="flex w-full items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What is the average value for the 'sales' column?"
            disabled={isChatting}
          />
          <Button type="submit" disabled={isChatting || !question.trim()}>
            {isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};


export default function ChatWithDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded: isUserLoaded } = useUser();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
      setCsvData(null); // Clear previous data
    }
  };
  
  const handleLoadFile = async () => {
      if (!file) {
          setError("Please select a file to chat with.");
          return;
      }
      setIsLoading(true);
      setError(null);
      
      try {
          const fileContent = await file.text();
          setCsvData(fileContent);
      } catch (err) {
          setError("Could not read file. Please try again.");
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  }

  const isReady = isUserLoaded;

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Chat with Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV file and ask questions to get instant insights.
            </p>
          </header>

          <AnimatePresence mode="wait">
             {csvData && file ? (
                <motion.div key="chat-interface" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatInterface csvData={csvData} fileName={file.name} />
                </motion.div>
             ) : (
                 <motion.div key="upload-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
                              Select a .csv file from your computer to start chatting. Max file size: 1MB.
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
                              <Button onClick={handleLoadFile} disabled={!file || isLoading} className="w-full sm:w-auto">
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" /> Start Chat
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                    )}
                 </motion.div>
             )}
          </AnimatePresence>

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
        </div>
      </main>
    </SidebarProvider>
  );
}
