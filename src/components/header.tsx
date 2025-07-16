
"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Header() {
  return (
    <header className="container mx-auto p-4 flex justify-between items-center">
      <Link href="/" className="font-headline text-2xl font-bold text-primary">
        FormulaFlow
      </Link>
      <div className="flex items-center gap-4">
        <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
            <Button asChild>
              <Link href="/formula">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
