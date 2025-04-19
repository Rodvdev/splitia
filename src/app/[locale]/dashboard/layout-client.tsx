'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
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
  const pathname = usePathname();
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
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              pathname?.endsWith(item.href) || 
              (item.href === '/dashboard' && pathname === '/dashboard')
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
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
        </div>
        <div className="px-6 mb-6">
          <UserProfileDisplay />
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
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
        "md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-white text-sidebar-foreground transition-transform duration-300 ease-in-out shadow-lg",
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
        <div className="px-6 mb-6">
          <UserProfileDisplay />
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
      </aside>

      {/* Main content wrapper with grid background */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Grid pattern background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>
        
        {/* Mobile header */}
        <header className="md:hidden border-b p-4 flex items-center justify-between relative z-10 backdrop-blur-md dark:bg-gray-950/80">
          <h1 className="text-xl font-bold">{t('app.name')}</h1>
          <div className="flex items-center gap-3">
            <UserProfileDisplay showDetails={false} />
            <button 
              className="p-2 rounded-lg hover:bg-accent" 
              onClick={toggleMobileNav}
            >
              <Menu className="w-6 h-6" />
            </button>
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