'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Overview', href: '/', icon: '📊' },
  { name: 'Accounts', href: '/accounts', icon: '💳' },
  { name: 'Transactions', href: '/transactions', icon: '📝' },
  { name: 'Subscriptions', href: '/subscriptions', icon: '🔄' },
  { name: 'Mortgages', href: '/mortgages', icon: '🏠' },
  { name: 'Reports', href: '/reports', icon: '📈' },
];

const secondaryNavigation = [
  { name: 'Import', href: '/import', icon: '📥' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400">
            <svg className="w-4 h-4 text-navy-950" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-display font-semibold">Meridian</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-gold-400">
                  <svg className="w-6 h-6 text-navy-950" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight font-display">Meridian</h1>
                  <p className="text-xs text-muted-foreground">Personal Finance</p>
                </div>
              </div>

              {/* Main Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gold-500/10 text-gold-500'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Secondary Navigation */}
              <div className="px-4 py-4 border-t border-border">
                {secondaryNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gold-500/10 text-gold-500'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
