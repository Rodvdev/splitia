'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Wallet,
  Settings,
  MessageSquare,
  LogOut,
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname.endsWith(item.href) || 
                    (item.href === '/dashboard' && pathname === '/dashboard')
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : ""
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
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

      {/* Mobile header */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="md:hidden border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <button className="p-2 rounded-lg hover:bg-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
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