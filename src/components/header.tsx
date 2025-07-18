
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn } from "lucide-react";

export function Header() {
  return (
    <header className="container mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="font-headline text-2xl font-bold text-primary">
        FormulaFlow
      </Link>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/formula">Go to App</Link>
        </Button>
      </div>
    </header>
  );
}
