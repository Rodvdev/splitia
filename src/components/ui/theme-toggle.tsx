'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserPreferences } from '@/components/user/user-preferences-provider';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

// Match the ThemeMode enum from Prisma
enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

export function ThemeToggle() {
  const { theme, setTheme: setUserTheme } = useUserPreferences();
  const { setTheme: setNextTheme } = useTheme();
  const t = useTranslations('settings.theme');
  
  // Sync the theme between useUserPreferences and next-themes
  useEffect(() => {
    if (theme === ThemeMode.LIGHT) setNextTheme('light');
    else if (theme === ThemeMode.DARK) setNextTheme('dark');
    else if (theme === ThemeMode.SYSTEM) setNextTheme('system');
  }, [theme, setNextTheme]);

  // Handle theme change
  const handleThemeChange = (newTheme: ThemeMode) => {
    setUserTheme(newTheme);
    
    // Also set next-themes theme
    if (newTheme === ThemeMode.LIGHT) setNextTheme('light');
    else if (newTheme === ThemeMode.DARK) setNextTheme('dark');
    else if (newTheme === ThemeMode.SYSTEM) setNextTheme('system');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-indigo-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 shadow-lg dark:shadow-indigo-900/20 border dark:border-slate-700 rounded-xl overflow-hidden backdrop-blur-sm dark:backdrop-blur-md"
      >
        <div className="p-2 space-y-1">
          <DropdownMenuItem 
            onClick={() => handleThemeChange(ThemeMode.LIGHT)} 
            className="flex justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center">
              <Sun className="mr-2 h-4 w-4 text-amber-500" />
              <span className="dark:text-slate-100">{t('light')}</span>
            </div>
            {theme === ThemeMode.LIGHT && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange(ThemeMode.DARK)} 
            className="flex justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center">
              <Moon className="mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className="dark:text-slate-100">{t('dark')}</span>
            </div>
            {theme === ThemeMode.DARK && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange(ThemeMode.SYSTEM)} 
            className="flex justify-between rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center">
              <Monitor className="mr-2 h-4 w-4 text-gray-600 dark:text-slate-400" />
              <span className="dark:text-slate-100">{t('system')}</span>
            </div>
            {theme === ThemeMode.SYSTEM && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 