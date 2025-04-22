'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/use-profile';
import UserProfileDisplay from '@/components/user/UserProfileDisplay';

type ClientLayoutProps = {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default function DashboardClientLayout({
  children,
  params
}: ClientLayoutProps) {
  const t = useTranslations();
  const router = useRouter();
  const { profile } = useProfile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userLocale, setUserLocale] = useState<string>(params.locale);
  
  // Set user's preferred locale from profile
  useEffect(() => {
    if (profile?.language) {
      setUserLocale(profile.language);
    }
  }, [profile]);
  
  // Build localized path
  const getLocalizedPath = (path: string) => {
    if (!userLocale) return path;
    
    if (path === '/dashboard') {
      return `/${userLocale}/dashboard`;
    } else {
      return `/${userLocale}${path}`;
    }
  };

  // Navigation items with icons
  const navItems = [
    {
      href: '/dashboard',
      label: t('navigation.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: '/dashboard/expenses',
      label: t('navigation.expenses'),
      icon: <Receipt className="h-5 w-5" />,
    },
    {
      href: '/dashboard/groups',
      label: t('navigation.groups'),
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: '/dashboard/budget',
      label: t('navigation.budget'),
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      href: '/dashboard/chat',
      label: t('navigation.chat'),
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(getLocalizedPath(href));
    closeMobileNav();
  };

  const renderNavItems = () => (
    <ul className="space-y-2">
      {navItems.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-white-accent hover:text-accent-foreground"
            )}
            onClick={(e) => handleNavigation(item.href, e)}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-white">

      {/* Main content wrapper with grid background */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Grid pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
} 