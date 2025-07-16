
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Bot, Lightbulb, Zap } from "lucide-react";
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
  hidden: { x: 50, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "AI-Powered Accuracy",
    description: "Our advanced AI understands complex requests to deliver precise and reliable formulas every time.",
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Instant Explanations",
    description: "Don't just copy-paste. Understand how each formula works with clear, step-by-step breakdowns.",
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "Excel & Google Sheets",
    description: "Get the right syntax for both major spreadsheet platforms, saving you time and effort.",
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

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground bg-gradient-to-br from-background via-card to-secondary/10">
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
            className="font-headline text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-fuchsia-500 to-orange-400"
            variants={itemVariants}
          >
            Convert English to Excel Formulas Instantly
          </motion.h1>
          <motion.p
            className="mt-6 max-w-2xl mx-auto text-xl text-muted-foreground"
            variants={itemVariants}
          >
            Stop Googling. Start generating. Describe any calculation in plain English and let our AI do the heavy lifting for you.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10">
            <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
              <Link href="/formula">
                Try It Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
            <h2 className="font-headline text-4xl font-bold">Why You'll Love FormulaFlow</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need for spreadsheet mastery.</p>
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
            <h2 className="font-headline text-4xl font-bold">Get Your Formula in 3 Easy Steps</h2>
            <p className="mt-4 text-lg text-muted-foreground">It's as simple as one, two, three.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">1.</div>
              <h3 className="font-headline text-xl mt-2">Describe</h3>
              <p className="text-muted-foreground mt-2">Write down what you want to calculate in plain English.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">2.</div>
              <h3 className="font-headline text-xl mt-2">Generate</h3>
              <p className="text-muted-foreground mt-2">Click the button and let our AI create the perfect formula.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <div className="text-5xl font-bold text-primary/50">3.</div>
              <h3 className="font-headline text-xl mt-2">Copy</h3>
              <p className="text-muted-foreground mt-2">Instantly copy the formula for Excel or Google Sheets.</p>
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
            Boost your productivity and become a spreadsheet pro today.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-8">
            <Button size="lg" asChild className="shadow-lg shadow-primary/20">
              <Link href="/formula">
                Start Generating Formulas for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </motion.section>
      </main>
      
      <footer className="container mx-auto p-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} FormulaFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
