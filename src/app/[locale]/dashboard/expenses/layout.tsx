'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ListFilter,
  PlusCircle,
  Calendar,
  Banknote,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('expenses');
  const pathname = usePathname();

  // Sub-navigation items specific to expenses section
  const subNavItems = [
    {
      href: '/dashboard/expenses',
      label: t('nav.all'),
      icon: <ListFilter className="h-5 w-5" />,
    },
    {
      href: '/dashboard/expenses/create',
      label: t('nav.create'),
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      href: '/dashboard/expenses/monthly',
      label: t('nav.monthly'),
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      href: '/dashboard/expenses/recurring',
      label: t('nav.recurring'),
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      href: '/dashboard/expenses/statistics',
      label: t('nav.statistics'),
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Sub-navigation */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-3 gap-2">
            {subNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  pathname.endsWith(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  );
} 