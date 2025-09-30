'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/hooks/useLocale';
import { 
  Home, 
  Wallet, 
  Store, 
  Gift,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const t = useTranslations('navigation');
  const { locale } = useLocale();
  const pathname = usePathname();

  const navigationItems = [
    { 
      key: 'home', 
      href: `/${locale}`, 
      icon: Home,
      activePattern: new RegExp(`^/${locale}/?$`)
    },
    { 
      key: 'wallet', 
      href: `/${locale}/wallet`, 
      icon: Wallet,
      activePattern: new RegExp(`^/${locale}/wallet`)
    },
    { 
      key: 'merchants', 
      href: `/${locale}/merchants`, 
      icon: Store,
      activePattern: new RegExp(`^/${locale}/merchants`)
    },
    { 
      key: 'rewards', 
      href: `/${locale}/rewards`, 
      icon: Gift,
      activePattern: new RegExp(`^/${locale}/rewards`)
    },
    { 
      key: 'profile', 
      href: `/${locale}/profile`, 
      icon: User,
      activePattern: new RegExp(`^/${locale}/profile`)
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.activePattern.test(pathname);
          
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-all duration-200",
                "hover:bg-accent/50 active:scale-95",
                isActive 
                  ? "text-primary bg-accent/30" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive && "scale-110"
                )} 
              />
              <span className={cn(
                "transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {t(item.key)}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}