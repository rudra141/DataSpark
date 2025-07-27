
'use client';

import { useState, useRef, useEffect, useContext, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bot, FileClock, Loader2, Send, Sparkles, Trash2, Zap } from 'lucide-react';
import { chatWithData, type ChatMessage } from '@/ai/flows/chat-with-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppSidebar } from '@/components/app-sidebar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataContext, FREE_GENERATIONS_LIMIT } from '@/context/data-context';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import short from 'short-uuid';
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

type FileHistoryItem = {
  id: string;
  fileName: string;
  csvData: string;
};

const ChatInterface = ({ csvData, fileName }: { csvData: string; fileName: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { generationCount, setGenerationCount } = useContext(DataContext);
  
  const hasReachedLimit = generationCount !== null && generationCount >= FREE_GENERATIONS_LIMIT;


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    const initialQuestion = searchParams.get('q');
    let initialMessages: ChatMessage[] = [{role: 'model', content: `File loaded: **${fileName}**. What would you like to know about it?`}];
    
    if (initialQuestion) {
        initialMessages.push({ role: 'user', content: initialQuestion });
        handleChatSubmit(null, initialQuestion);
    }
    
    setMessages(initialMessages);
  }, [fileName, searchParams]);

  const handleChatSubmit = async (e: React.FormEvent | null, initialQuestion?: string) => {
    e?.preventDefault();
    if (hasReachedLimit) return;
    const currentQuestion = initialQuestion || question;
    if (!currentQuestion.trim()) return;

    setIsChatting(true);
    if (!initialQuestion) {
        const userMessage: ChatMessage = { role: 'user', content: currentQuestion };
        setMessages((prev) => [...prev, userMessage]);
        setQuestion('');
    }

    try {
      const history = messages.filter(m => m.role !== 'model' || !m.content.startsWith('File loaded:'));
      const chatResult = await chatWithData({
        csvData,
        question: currentQuestion,
        history: history.slice(-4), // Send last 4 messages for context
      });
      const modelMessage: ChatMessage = { role: 'model', content: chatResult.answer };
      setMessages((prev) => [...prev, modelMessage]);
      setGenerationCount(prev => (prev !== null ? prev + 1 : 1));
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
          Ask questions in natural language to get specific insights from <strong>{fileName}</strong>.
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
                  className={`rounded-lg px-4 py-2 max-w-[90%] ${
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
            disabled={isChatting || !question.trim() || hasReachedLimit}
          />
          <Button type="submit" disabled={isChatting || !question.trim() || hasReachedLimit}>
            {isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

const UpgradeCard = () => (
    <Card className="text-center bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">You've Used Your Free Generations!</CardTitle>
        <CardDescription>
          Upgrade to a Pro plan to continue analyzing and chatting with your data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="lg" asChild>
          <Link href="/pricing">
            <Zap className="mr-2 h-5 w-5" /> Upgrade to Pro
          </Link>
        </Button>
      </CardContent>
    </Card>
);

const ChatWithDataPageContent = () => {
  const { csvData, fileName, setCsvData, setFileName, fileHistory, setFileHistory, isHistoryReady, generationCount, isContextReady } = useContext(DataContext);
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);
  
  const hasReachedLimit = generationCount !== null && generationCount >= FREE_GENERATIONS_LIMIT;


  const handleFileLoaded = (data: string, name: string) => {
    setCsvData(data);
    setFileName(name);
    setError(null);

    if (user?.id) {
        const newHistoryItem: FileHistoryItem = { id: short.generate(), fileName: name, csvData: data };
        setFileHistory(prev => [newHistoryItem, ...prev.filter(item => item.fileName !== name)]);
    }
  };

  const handleHistorySelect = (item: FileHistoryItem) => {
    setCsvData(item.csvData);
    setFileName(item.fileName);
  };
  
  const clearHistory = () => {
    setFileHistory([]);
    if (user?.id) {
        localStorage.removeItem(`fileHistory_${user.id}`);
    }
  };

  return (
    <>
     <AppSidebar>
         <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <FileClock />
              File History
            </SidebarGroupLabel>
            {isHistoryReady && fileHistory.length > 0 && (
              <SidebarGroupAction asChild>
                <button onClick={clearHistory} title="Clear file history">
                  <Trash2 />
                </button>
              </SidebarGroupAction>
            )}
            <SidebarMenu>
              {!isHistoryReady ? (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </div>
              ) : fileHistory.length > 0 ? (
                fileHistory.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      className="h-auto py-1"
                      onClick={() => handleHistorySelect(item)}
                      isActive={fileName === item.fileName}
                      tooltip={{ children: item.fileName, side: "right", align: "center" }}
                    >
                      <span className="truncate">{item.fileName}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <p className="px-2 text-xs text-muted-foreground">No files loaded yet.</p>
              )}
            </SidebarMenu>
          </SidebarGroup>
      </AppSidebar>
      <main className="container mx-auto p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Chat with Data
            </h1>
            <p className="text-muted-foreground mt-2">
              Upload a CSV or XLSX file and ask questions to get instant insights.
            </p>
          </header>

          <AnimatePresence mode="wait">
            {!isContextReady ? (
                <motion.div key="loading">
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                </motion.div>
            ) : hasReachedLimit ? (
                <motion.div key="limit-reached">
                    <UpgradeCard />
                </motion.div>
            ) : csvData && fileName ? (
                <motion.div key="chat-interface" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatInterface csvData={csvData} fileName={fileName} />
                </motion.div>
            ) : (
                <motion.div key="upload-form" className="w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <FileUpload onFileLoaded={handleFileLoaded}>
                        {/* No action button needed here as loading the file is the action */}
                    </FileUpload>
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Data Loaded</AlertTitle>
                      <AlertDescription>
                        Please upload a file to start chatting, or analyze a file first on the{' '}
                        <Button variant="link" asChild className="p-0 h-auto"><Link href="/data-analyzer">Data Analyzer</Link></Button> page.
                      </AlertDescription>
                    </Alert>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
};

export default function ChatWithDataPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatWithDataPageContent />
        </Suspense>
    )
}

    