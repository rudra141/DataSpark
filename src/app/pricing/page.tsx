
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Pro Monthly",
    price: "$5",
    period: "/ month",
    features: [
        "100 generations per month",
        "Access to all features",
        "Standard support"
    ],
    cta: "Choose Monthly",
  },
  {
    name: "Pro Yearly",
    price: "$50",
    period: "/ year",
    features: [
        "Unlimited generations",
        "Access to all features",
        "Priority support",
        "Early access to new features"
    ],
    cta: "Choose Yearly",
    isPopular: true,
  },
];

export default function PricingPage() {
  const handleSubscription = (planName: string) => {
    // In a real application, this would trigger a checkout flow with a payment provider like Stripe or Razorpay.
    // For this prototype, we'll just show an alert.
    alert(`You've selected the ${planName} plan! (This is a demo)`);
  };

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background via-card to-secondary/10 min-h-screen">
        <main className="container mx-auto p-4 sm:p-8">
          <motion.section
            className="text-center py-16 lg:py-24"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-headline text-5xl sm:text-6xl font-extrabold tracking-tight">
              Choose Your Plan
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
              Unlock the full power of DataSpark and supercharge your productivity. One plan for all features.
            </p>
          </motion.section>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, staggerChildren: 0.2 }}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className={`flex flex-col h-full ${plan.isPopular ? "border-primary shadow-primary/20" : ""}`}>
                  {plan.isPopular && (
                    <div className="bg-primary text-primary-foreground text-center text-sm font-bold py-1 rounded-t-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-headline text-3xl">{plan.name}</CardTitle>
                    <CardDescription className="flex items-baseline">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-1">{plan.period}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleSubscription(plan.name)}
                      className="w-full"
                      variant={plan.isPopular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </AppLayout>
  );
}
