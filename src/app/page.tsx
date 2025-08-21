
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Bot, BarChart, Calculator, Wand2, Sparkles, Github, Linkedin, Twitter as TwitterIcon } from "lucide-react";
import { motion } from "framer-motion";
import { BackgroundGradient } from "@/components/ui/aceternity/background-gradient";
import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";
import { Typewriter } from "@/components/ui/typewriter-text";
import GradientButton from "@/components/ui/button-1";

const features = [
  {
    icon: <BarChart className="h-8 w-8 text-white" />,
    title: "Data Analyzer",
    description: "Upload your CSV file and instantly receive key statistics, actionable insights, and beautiful, AI-recommended charts.",
    href: "/data-analyzer"
  },
  {
    icon: <Calculator className="h-8 w-8 text-white" />,
    title: "Formula Generator",
    description: "Describe any calculation in plain English. Our AI generates the precise, ready-to-use formula for Excel and Google Sheets.",
    href: "/formula"
  },
  {
    icon: <Bot className="h-8 w-8 text-white" />,
    title: "Chat with Data",
    description: "Go beyond static reports. Ask questions in natural language and get specific, contextual answers directly from your dataset.",
    href: "/chat-with-data"
  },
   {
    icon: <Wand2 className="h-8 w-8 text-white" />,
    title: "DIY with Data",
    description: "Your personal data artist. Use plain English to generate the exact charts and visualizations you need, on demand.",
    href: "/diy-data"
  },
];

const CTAButton = () => (
    <Link href="/formula">
        <GradientButton width="220px" height="60px">
             Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
        </GradientButton>
    </Link>
);

const Header = () => (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
            <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="font-headline text-2xl font-bold text-primary">DataSpark</span>
            </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <SignedOut>
            <Button variant="ghost" asChild>
                <SignInButton />
            </Button>
            <Button asChild>
                <SignUpButton />
            </Button>
          </SignedOut>
          <SignedIn>
              <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
)

const Starfield = () => (
  <div className="absolute inset-0 z-0">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute bg-white rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
          opacity: `${Math.random() * 0.5 + 0.2}`,
        }}
      />
    ))}
  </div>
);


export default function HomePage() {
  return (
    <div className="bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <div className="relative w-full bg-background h-auto py-32 md:py-40 overflow-hidden">
            <Starfield />
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="mb-4"
                >
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white"
                >
                    <Typewriter text="Unlock the Power of Data" speed={100} loop={false} />
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-neutral-300"
                >
                    Formulas, analysis, and charts—done for you in seconds. Make decisions that matter with DataSpark.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="mt-12"
                >
                    <CTAButton />
                </motion.div>
            </div>
        </div>
        
        <div className="bg-background relative z-10">
        {/* Features Section */}
        <motion.section
          id="features"
          className="py-20 lg:py-24 container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">A Full-Featured Data Toolkit</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need for spreadsheet and data mastery.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Link href={feature.href}>
                    <BackgroundGradient className="rounded-[22px] p-4 sm:p-6 bg-zinc-900 h-full">
                        <Card className="h-full text-center bg-transparent border-none shadow-none text-white flex flex-col justify-between">
                            <CardHeader>
                            <div className="mx-auto bg-zinc-800 rounded-full p-3 w-fit">
                                {feature.icon}
                            </div>
                            <CardTitle className="font-headline mt-4">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <p className="text-neutral-400">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </BackgroundGradient>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-20 text-center container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          <motion.h2 className="font-headline text-4xl font-bold">
            Ready to Simplify Your Data Workflow?
          </motion.h2>
          <motion.p className="mt-4 text-lg text-muted-foreground">
            Get started for free. No credit card required.
          </motion.p>
          <motion.div className="mt-8">
            <CTAButton />
          </motion.div>
        </motion.section>
        </div>
      </main>
      
      <footer className="border-t border-border/40">
        <div className="container mx-auto p-8 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <p className="text-muted-foreground text-sm">
                    © {new Date().getFullYear()} DataSpark. All Rights Reserved.
                </p>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <Link href="https://github.com/rudra141" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                        <Github className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                    <Link href="https://www.linkedin.com/in/rudraranjan/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <Linkedin className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                    <Link href="https://x.com/Projects117749" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <TwitterIcon className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
                Connect with us on social media!
            </p>
        </div>
      </footer>
    </div>
  );
}
