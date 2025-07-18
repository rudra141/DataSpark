"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="container mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="font-headline text-2xl font-bold text-primary">
        FormulaFlow
      </Link>
      <div className="flex items-center gap-4">
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
    </header>
  );
}
