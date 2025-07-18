
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Bot, BarChart, Calculator } from "lucide-react";
import { motion } from "framer-motion";
import { Header } from "@/components/header";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const features = [
  {
    icon: <Calculator className="h-8 w-8 text-primary" />,
    title: "Formula Generator",
    description: "Describe any calculation in plain English. Our AI generates the precise, ready-to-use formula for Excel and Google Sheets.",
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Data Analyzer",
    description: "Upload your CSV file and instantly receive key statistics, actionable insights, and beautiful, AI-recommended charts.",
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "Chat with Data",
    description: "Go beyond static reports. Ask questions in natural language and get specific, contextual answers directly from your dataset.",
  },
];

const testimonials = [
  {
    name: "Alex Johnson",
    title: "Data Analyst",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man portrait",
    quote: "This tool has saved me hours of frustration. I can finally focus on analysis instead of wrestling with complex syntax.",
  },
  {
    name: "Samantha Lee",
    title: "Marketing Manager",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "woman portrait",
    quote: "As someone who isn't a spreadsheet wizard, FormulaFlow is a lifesaver. It's so intuitive and the explanations are incredibly helpful.",
  },
  {
    name: "David Chen",
    title: "Small Business Owner",
    avatar: "https://placehold.co/100x100.png",
    dataAiHint: "man smile",
    quote: "I use this daily to manage my inventory and finances. It's like having a spreadsheet expert on my team 24/7.",
  },
];

const CTAButton = () => (
    <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
        <Link href="/formula">
            Get Started for Free <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
    </Button>
);

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-background via-card to-secondary/10">
      <Header />
      <main className="container mx-auto p-4 sm:p-8">
        {/* Hero Section */}
        <motion.section
          className="text-center py-20 lg:py-32 flex flex-col justify-center items-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1
            className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-orange-400"
            variants={itemVariants}
          >
            Your AI Assistant for Data & Spreadsheets
          </motion.h1>
          <motion.p
            className="mt-6 max-w-3xl mx-auto text-xl text-muted-foreground"
            variants={itemVariants}
          >
            Generate formulas, analyze datasets, and chat with your data in plain English. Stop wrestling with data and start getting answers.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10">
             <CTAButton />
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          id="features"
          className="py-20 lg:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">A Full-Featured Data Toolkit</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need for spreadsheet and data mastery.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full text-center bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-primary/10 hover:shadow-lg">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          id="how-it-works"
          className="py-20 lg:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">Get Insights in Seconds</h2>
            <p className="mt-4 text-lg text-muted-foreground">A simple, unified workflow for all your data tasks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">1.</div>
              <h3 className="font-headline text-xl mt-2">Provide Input</h3>
              <p className="text-muted-foreground mt-2">Describe your goal, upload a CSV, or ask a question.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">2.</div>
              <h3 className="font-headline text-xl mt-2">Let AI Work</h3>
              <p className="text-muted-foreground mt-2">Our AI analyzes your request and data to find the solution.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">3.</div>
              <h3 className="font-headline text-xl mt-2">Get Results</h3>
              <p className="text-muted-foreground mt-2">Receive formulas, charts, or direct answers instantly.</p>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          id="testimonials"
          className="py-20 lg:py-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">Trusted by Professionals</h2>
            <p className="mt-4 text-lg text-muted-foreground">Don't just take our word for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full flex flex-col justify-between bg-card/50 backdrop-blur-sm border-primary/10">
                  <CardContent className="pt-6">
                    <p className="italic text-foreground">"{testimonial.quote}"</p>
                  </CardContent>
                  <CardHeader className="flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint}/>
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          className="py-20 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={containerVariants}
        >
          <motion.h2 className="font-headline text-4xl font-bold" variants={itemVariants}>
            Ready to Simplify Your Spreadsheets?
          </motion.h2>
          <motion.p className="mt-4 text-lg text-muted-foreground" variants={itemVariants}>
            Boost your productivity and become a data pro today.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <CTAButton />
          </motion.div>
        </motion.section>
      </main>
      
      <footer className="container mx-auto p-8 text-center text-muted-foreground text-sm">
        © {new Date().getFullYear()} FormulaFlow. All Rights Reserved.
      </footer>
    </div>
  );
}
