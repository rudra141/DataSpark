import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { Header } from '@/components/header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'FormulaFlow',
  description: 'Generate Excel and Google Sheets formulas from natural language.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      baseTheme: dark,
    }}>
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="font-body antialiased">
          <div className="min-h-screen w-full bg-background text-foreground bg-gradient-to-br from-background via-card to-secondary/10">
            <Header />
            {children}
            <Toaster />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
