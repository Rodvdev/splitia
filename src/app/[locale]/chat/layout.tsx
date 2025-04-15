'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Wallet,
  Receipt,
  Menu,
  X,
  LogIn
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

  // Navigation items with icons (all disabled except chat)
  const navItems = [
    {
      href: '/dashboard',
      label: t('navigation.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      disabled: true
    },
    {
      href: '/dashboard/expenses',
      label: t('navigation.expenses'),
      icon: <Receipt className="h-5 w-5" />,
      disabled: true
    },
    {
      href: '/dashboard/groups',
      label: t('navigation.groups'),
      icon: <Users className="h-5 w-5" />,
      disabled: true
    },
    {
      href: '/dashboard/budget',
      label: t('navigation.budget'),
      icon: <Wallet className="h-5 w-5" />,
      disabled: true
    },
    {
      href: '/chat',
      label: t('chat.title'),
      icon: <MessageSquare className="h-5 w-5" />,
      disabled: false
    }
  ];

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  const closeMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  const handleNavigation = (href: string, disabled: boolean, e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      router.push(getLocalizedPath(href));
      closeMobileNav();
    }
  };

  const handleLogin = () => {
    router.push(getLocalizedPath('/login'));
  };

  const renderNavItems = () => (
    <ul className="space-y-2">
      {navItems.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              item.disabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname?.endsWith(item.href) || 
              (item.href === '/chat' && pathname === getLocalizedPath('/chat'))
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : ""
            )}
            onClick={(e) => handleNavigation(item.href, item.disabled, e)}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
            {item.disabled && (
              <span className="ml-auto text-xs text-muted-foreground">
                {t('auth.signInRequired')}
              </span>
            )}
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
        <div className="p-4 border-t flex justify-between items-center">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogin}
            className="ml-auto flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            {t('auth.signIn')}
          </Button>
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
        <div className="p-4 border-t flex justify-between items-center">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogin}
            className="ml-auto flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            {t('auth.signIn')}
          </Button>
        </div>
      </aside>

      {/* Main content wrapper with grid background */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Grid pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        {/* Mobile header */}
        <header className="md:hidden border-b p-4 flex items-center justify-between relative z-10 bg-white/80 backdrop-blur-md dark:bg-gray-950/80">
          <h1 className="text-xl font-bold">Splitia</h1>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleLogin}
            >
              <LogIn className="w-5 h-5" />
            </Button>
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
        <main className="flex-1 overflow-auto relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
} 