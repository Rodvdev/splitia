'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserPreferences } from '@/components/user/user-preferences-provider';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

// Match the ThemeMode enum from Prisma
enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

export function ThemeToggle() {
  const { theme, setTheme } = useUserPreferences();
  const t = useTranslations('settings.theme');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme(ThemeMode.LIGHT)} className="flex justify-between">
          <div className="flex items-center">
            <Sun className="mr-2 h-4 w-4" />
            <span>{t('light')}</span>
          </div>
          {theme === ThemeMode.LIGHT && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(ThemeMode.DARK)} className="flex justify-between">
          <div className="flex items-center">
            <Moon className="mr-2 h-4 w-4" />
            <span>{t('dark')}</span>
          </div>
          {theme === ThemeMode.DARK && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(ThemeMode.SYSTEM)} className="flex justify-between">
          <div className="flex items-center">
            <Monitor className="mr-2 h-4 w-4" />
            <span>{t('system')}</span>
          </div>
          {theme === ThemeMode.SYSTEM && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 