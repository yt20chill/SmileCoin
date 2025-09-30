'use client';

import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export function MainLayout({ 
  children, 
  className,
  showBottomNav = true,
  showHeader = true 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      
      <ErrorBoundary>
        <main 
          className={cn(
            "flex-1",
            showHeader && "pt-0", // Header is sticky, no extra padding needed
            showBottomNav && "pb-16 md:pb-0", // Bottom nav height on mobile
            className
          )}
        >
          {children}
        </main>
      </ErrorBoundary>
      
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}