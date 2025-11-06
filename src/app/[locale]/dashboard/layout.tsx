'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
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
import { Providers } from "@/app/providers";

// Import language messages
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import pt from '@/i18n/locales/pt.json';

// Define messages by locale
const messages = {
  en,
  es,
  pt
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function DashboardLayout({
  children,
  params
}: LayoutProps) {
  // Unwrap params Promise using React.use()
  const { locale: localeParam } = use(params);
  // Set default locale if not provided
  const locale = (localeParam || 'en') as keyof typeof messages;
  
  return (
    <Providers locale={locale} messages={messages[locale]}>
      <DashboardContent params={params}>
        {children}
      </DashboardContent>
    </Providers>
  );
}

function DashboardContent({
  children,
  params
}: LayoutProps) {
  // Unwrap params Promise using React.use()
  const { locale: localeParam } = use(params);
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userLocale, setUserLocale] = useState<string>('');
  
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

  // Check if a navigation item is active based on pathname
  const isActive = (href: string) => {
    if (!pathname) return false;
    
    // Normalize pathname by removing locale prefix if present
    const normalizedPathname = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?\//, '/');
    
    // For dashboard, only match exactly (not nested routes)
    if (href === '/dashboard') {
      return normalizedPathname === '/dashboard' || normalizedPathname === '/dashboard/';
    }
    
    // For other items, check if pathname starts with the href
    // This will match /dashboard/groups, /dashboard/groups/123, etc.
    return normalizedPathname.startsWith(href + '/') || normalizedPathname === href;
  };

  const renderNavItems = () => (
    <ul className="space-y-2">
      {navItems.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            className={cn(
              "flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
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
      <aside className="hidden md:flex w-64 flex-col border-r bg-card text-sidebar-foreground">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {isMobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background z-40"
          onClick={closeMobileNav}
        />
      )}

      {/* Mobile Sidebar - Content */}
      <aside className={cn(
        "md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-card text-sidebar-foreground transition-transform duration-300 ease-in-out shadow-lg",
        isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-sidebar-foreground">
            {t('app.name')}
          </h1>
          <button
            onClick={closeMobileNav}
            className="p-1 rounded-lg hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {renderNavItems()}
        </nav>
      </aside>

      {/* Main content wrapper with background pattern */}
      <div className="flex flex-1 flex-col overflow-hidden relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Grid pattern background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        </div>

        {/* Top Bar - Always visible */}
        <header className="border-b p-4 flex items-center justify-between relative z-10 bg-card shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-accent" 
              onClick={toggleMobileNav}
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* App name - hidden on mobile, shown on desktop */}
            <h1 className="hidden md:block text-xl font-bold">{t('app.name')}</h1>
          </div>
          
          {/* User profile and options */}
          <div className="flex items-center gap-3">
            <UserProfileDisplay showDetails={false} />
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