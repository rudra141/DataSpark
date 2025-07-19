
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="font-headline text-2xl font-bold text-primary">
            DataSpark
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
  );
}
