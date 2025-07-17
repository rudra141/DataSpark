
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="container mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="font-headline text-2xl font-bold text-primary">
        FormulaFlow
      </Link>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="#features">Features</Link>
        </Button>
        <Button asChild>
          <Link href="/formula">Get Started</Link>
        </Button>
      </div>
    </header>
  );
}

    