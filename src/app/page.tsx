
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Bot, BarChart, Calculator, Wand2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { BackgroundGradient } from "@/components/ui/aceternity/background-gradient";
import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

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

const testimonials = [
  {
    name: "Alex Johnson",
    title: "Data Analyst",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man portrait",
    quote: "DataSpark has saved me hours of frustration. I can finally focus on analysis instead of wrestling with complex syntax and chart setups.",
  },
  {
    name: "Samantha Lee",
    title: "Marketing Manager",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "woman portrait",
    quote: "As someone who isn't a spreadsheet wizard, DataSpark is a lifesaver. The chat and DIY features are incredibly powerful.",
  },
  {
    name: "David Chen",
    title: "Small Business Owner",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man smile",
    quote: "I use this daily to manage my inventory and finances. It's like having a data expert on my team 24/7.",
  },
];

const CTAButton = () => (
    <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
        <Link href="/data-analyzer">
            Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
    </Button>
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
          <ThemeToggle />
          <SignedOut>
            <Button variant="ghost" asChild>
                <SignInButton />
            </Button>
            <Button asChild>
                <SignUpButton />
            </Button>
          </SignedOut>
          <SignedIn>
              <Button variant="outline" asChild>
                  <Link href="/pricing">Pricing</Link>
              </Button>
              <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
)

export default function HomePage() {
  return (
    <div className="bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <div className="relative w-full bg-background h-auto py-40 md:py-60 overflow-hidden">
            <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-background to-primary/10"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                <TextGenerateEffect
                    words="Your AI Assistant for Data & Spreadsheets"
                    className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-orange-400"
                />
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                    className="mt-6 max-w-3xl mx-auto text-xl text-neutral-300"
                >
                    Generate formulas, analyze datasets, and build custom charts in plain English. Stop wrestling with data and start getting answers.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 0.8 }}
                    className="mt-10"
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
              <motion.div key={index}>
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

        {/* Testimonials Section */}
        <motion.section
          id="testimonials"
          className="py-20 lg:py-24 container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">Trusted by Professionals</h2>
            <p className="mt-4 text-lg text-muted-foreground">Don't just take our word for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index}>
                <BackgroundGradient className="rounded-[22px] p-4 sm:p-10 bg-zinc-900 h-full">
                    <Card className="h-full flex flex-col justify-between bg-transparent border-none shadow-none text-white">
                    <CardContent className="pt-6">
                        <p className="italic">"{testimonial.quote}"</p>
                    </CardContent>
                    <CardHeader className="flex-row items-center gap-4">
                        <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint}/>
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-neutral-400">{testimonial.title}</p>
                        </div>
                    </CardHeader>
                    </Card>
                </BackgroundGradient>
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
            Boost your productivity and become a data pro today.
          </motion.p>
          <motion.div className="mt-8">
            <CTAButton />
          </motion.div>
        </motion.section>
        </div>
      </main>
      
      <footer className="container mx-auto p-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} DataSpark. All Rights Reserved.
      </footer>
    </div>
  );
}

    