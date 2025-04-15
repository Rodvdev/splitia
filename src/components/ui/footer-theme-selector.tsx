'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/components/user/user-preferences-provider';
import { useTranslations } from 'next-intl';

// Match the ThemeMode enum from Prisma
enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

export function FooterThemeSelector() {
  const { theme, setTheme } = useUserPreferences();
  const t = useTranslations('settings.theme');

  return (
    <div className="mt-4">
      <h3 className="font-medium mb-3">{t('title')}</h3>
      <div className="flex gap-2">
        <Button 
          variant={theme === ThemeMode.LIGHT ? "default" : "outline"} 
          size="sm" 
          onClick={() => setTheme(ThemeMode.LIGHT)}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          <span className="text-xs">{t('light')}</span>
        </Button>
        
        <Button 
          variant={theme === ThemeMode.DARK ? "default" : "outline"} 
          size="sm" 
          onClick={() => setTheme(ThemeMode.DARK)}
          className="flex items-center gap-2"
        >
          <Moon className="h-4 w-4" />
          <span className="text-xs">{t('dark')}</span>
        </Button>
        
        <Button 
          variant={theme === ThemeMode.SYSTEM ? "default" : "outline"} 
          size="sm" 
          onClick={() => setTheme(ThemeMode.SYSTEM)}
          className="flex items-center gap-2"
        >
          <Monitor className="h-4 w-4" />
          <span className="text-xs">{t('system')}</span>
        </Button>
      </div>
    </div>
  );
} 