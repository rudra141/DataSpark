
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Header() {
  return (
    <header className="container mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="font-headline text-2xl font-bold text-primary">
        FormulaFlow
      </Link>
      <div className="flex items-center gap-4">
        <SignedOut>
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Sign Up <ArrowRight className="ml-2" /></Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
