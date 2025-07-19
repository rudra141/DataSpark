
'use client';

import { useState, useRef, useEffect, useContext, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { chatWithData, type ChatMessage } from '@/ai/flows/chat-with-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataContext } from '@/context/data-context';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';

const ChatInterface = ({ csvData, fileName }: { csvData: string; fileName: string }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

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
  }, [fileName]); // Only run once when fileName changes

  const handleChatSubmit = async (e: React.FormEvent | null, initialQuestion?: string) => {
    e?.preventDefault();
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

const ChatWithDataPageContent = () => {
  const { csvData, fileName, setCsvData, setFileName } = useContext(DataContext);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoaded = (data: string, name: string) => {
    setCsvData(data);
    setFileName(name);
    setError(null);
  };
  
  return (
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
           {csvData && fileName ? (
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
  );
};


export default function ChatWithDataPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SidebarProvider>
                <AppSidebar />
                <ChatWithDataPageContent />
            </SidebarProvider>
        </Suspense>
    )
}
