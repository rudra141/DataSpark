
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Bot, Calculator, Sparkles, Wand2 } from 'lucide-react';

import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
    {
      href: '/data-analyzer',
      label: 'Data Analyzer',
      icon: BarChart,
    },
    {
      href: '/formula',
      label: 'Formula Generator',
      icon: Calculator,
    },
    {
        href: '/chat-with-data',
        label: 'Chat with Data',
        icon: Bot,
    },
    {
        href: '/diy-data',
        label: 'DIY Data',
        icon: Wand2,
    }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                </Link>
                <div className="font-headline text-lg font-bold text-primary">DataSpark</div>
                </div>
            </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} className="w-full">
                    <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={{
                        children: item.label,
                        side: 'right',
                        align: 'center',
                        }}
                    >
                        <item.icon />
                        {item.label}
                    </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                ))}
            </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                 <div className="container flex h-14 max-w-screen-2xl items-center">
                    <div className="mr-4 hidden md:flex">
                        <SidebarTrigger />
                    </div>
                    <div className="flex flex-1 items-center justify-end space-x-2">
                        <SignedOut>
                            <Button variant="ghost" asChild>
                                <SignInButton />
                            </Button>
                            <Button asChild>
                                <SignUpButton />
                            </Button>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                 </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
