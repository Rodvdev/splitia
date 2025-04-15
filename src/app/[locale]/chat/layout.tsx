'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userLocale, setUserLocale] = useState<string>('');
  
  // Extract locale from pathname
  useEffect(() => {
    const localeMatch = pathname?.match(/^\/([^/]+)/);
    if (localeMatch && localeMatch[1]) {
      setUserLocale(localeMatch[1]);
    }
  }, [pathname]);
  
  // Build localized path
  const getLocalizedPath = (path: string) => {
    if (!userLocale) return path;
    return `/${userLocale}${path}`;
  };

  // Navigation items
  const navItems = [
    {
      href: '/',
      label: t('navigation.home'),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      href: '/chat',
      label: t('chat.title'),
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: '/chat/groups',
      label: t('navigation.groups'),
      icon: <Users className="h-5 w-5" />,
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
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname?.endsWith(item.href) || 
              (item.href === '/chat' && pathname === getLocalizedPath('/chat'))
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : ""
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
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <Link href={getLocalizedPath('/')} className="text-2xl font-bold text-sidebar-foreground">
            Splitia
          </Link>
        </div>
        <div className="flex items-center justify-between px-6 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-medium">S</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{t('chat.aiAssistant')}</p>
              <p className="text-xs text-muted-foreground">{t('chat.aiAssistantHelp')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
        <div className="p-4 border-t">
          <ThemeToggle />
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
        "md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-white dark:bg-gray-950 text-sidebar-foreground transition-transform duration-300 ease-in-out shadow-lg",
        isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <Link href={getLocalizedPath('/')} className="text-2xl font-bold text-sidebar-foreground">
            Splitia
          </Link>
          <button 
            onClick={closeMobileNav}
            className="p-1 rounded-lg hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center px-6 mb-6">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium">S</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{t('chat.aiAssistant')}</p>
            <p className="text-xs text-muted-foreground">{t('chat.aiAssistantHelp')}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
        <div className="p-4 border-t">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Splitia</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileNav}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 