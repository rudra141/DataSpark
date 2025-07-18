
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Calculator, Sparkles } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export function AppSidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: '/formula',
      label: 'Formula Generator',
      icon: Calculator,
    },
    {
      href: '/data-analyzer',
      label: 'Data Analyzer',
      icon: BarChart,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Sparkles className="h-4 w-4 text-primary" />
              </Button>
            </Link>
            <div className="font-headline text-lg font-bold text-primary">FormulaFlow</div>
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
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
