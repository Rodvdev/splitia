'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  Settings,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { signOut, isLoading: isSigningOut } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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
      href: '/budget',
      label: t('navigation.budget'),
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      href: '/chat',
      label: t('navigation.chat'),
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: '/settings',
      label: t('navigation.settings'),
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const renderNavItems = () => (
    <ul className="space-y-2">
      {navItems.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname?.endsWith(item.href) || 
              (item.href === '/dashboard' && pathname === '/dashboard')
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : ""
            )}
            onClick={closeMobileNav}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
        <div className="border-t p-4">
          <button 
            className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">
              {isSigningOut ? t('common.loading') : t('auth.signOut')}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {isMobileNavOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileNav}
        />
      )}

      {/* Mobile Sidebar - Content */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out",
        isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
          <button 
            onClick={closeMobileNav}
            className="p-1 rounded-lg hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
        <div className="border-t p-4">
          <button 
            className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="ml-3">
              {isSigningOut ? t('common.loading') : t('auth.signOut')}
            </span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <button 
            className="p-2 rounded-lg hover:bg-accent" 
            onClick={toggleMobileNav}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 