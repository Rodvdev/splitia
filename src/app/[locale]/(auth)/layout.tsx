'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Users, SplitSquareVertical, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
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

  // Determine if we're on the login or sign-up page
  const isLoginPage = pathname?.includes('/login');
  const isSignUpPage = pathname?.includes('/sign-up');
  
  const goBack = () => {
    router.push(getLocalizedPath('/'));
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-950">
      {/* Header */}
      <header className="relative z-10 py-4 px-6 flex items-center justify-between bg-transparent">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={goBack}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link href={getLocalizedPath('/')} className="flex items-center">
            <span className="text-2xl font-bold dark:text-white">Splitia</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isLoginPage && (
            <Link 
              href={getLocalizedPath('/sign-up')} 
              className="text-sm font-medium hover:underline hidden md:inline-block dark:text-gray-300"
            >
              {t('auth.noAccount')} {t('auth.signUp')}
            </Link>
          )}
          {isSignUpPage && (
            <Link 
              href={getLocalizedPath('/login')} 
              className="text-sm font-medium hover:underline hidden md:inline-block dark:text-gray-300"
            >
              {t('auth.hasAccount')} {t('auth.signIn')}
            </Link>
          )}
        </div>
      </header>
      
      {/* Main content - split layout (directly in the screen) */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Informative section (hidden on mobile) - Full height, directly on screen */}
        <div className="hidden md:flex md:w-1/2 bg-primary dark:bg-gray-900 text-primary-foreground dark:text-white relative">
          {/* Grid pattern background on primary section */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
          </div>
          
          <div className="flex flex-col justify-center p-12 relative z-10 max-w-md mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-white">
              {isLoginPage ? t('auth.welcomeBack') : t('auth.createAccount')}
            </h1>
            <p className="text-xl mb-10 opacity-90 text-white">
              {isLoginPage 
                ? t('auth.loginInfoText') || "Accede a tu cuenta para gestionar tus gastos compartidos de forma sencilla"
                : t('auth.signupInfoText') || "Únete a Splitia y comienza a dividir gastos con amigos y familiares"}
            </p>
            
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg text-white">{t('hero.feature1') || "Grupos ilimitados"}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <SplitSquareVertical className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg text-white">{t('hero.feature2') || "División inteligente"}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg text-white">{t('hero.feature3') || "Multi-moneda"}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Authentication forms section - Full height, directly on screen */}
        <div className="w-full md:w-1/2 bg-gradient-to-b from-blue-50 to-white dark:from-gray-950 dark:to-gray-900 flex flex-col relative">
          {/* Grid pattern background */}
          <div className="absolute inset-0">
            <div className={cn(
              "absolute inset-0 bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center",
              "[mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]",
              "dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0))]",
              "opacity-100 dark:opacity-50"
            )}></div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 relative z-10">
            <div className="w-full max-w-md">
              {children}
              
              {/* Mobile-only links */}
              <div className="mt-6 text-center md:hidden">
                {isLoginPage && (
                  <Link 
                    href={getLocalizedPath('/sign-up')} 
                    className="text-sm font-medium text-primary hover:underline dark:text-blue-400"
                  >
                    {t('auth.noAccount')} {t('auth.signUp')}
                  </Link>
                )}
                {isSignUpPage && (
                  <Link 
                    href={getLocalizedPath('/login')} 
                    className="text-sm font-medium text-primary hover:underline dark:text-blue-400"
                  >
                    {t('auth.hasAccount')} {t('auth.signIn')}
                  </Link>
                )}
              </div>
            </div>
          </div>
          
          {/* Footer inside the right section */}
          <footer className="py-4 px-6 text-center text-sm text-muted-foreground dark:text-gray-400 relative z-10">
            <p>© {new Date().getFullYear()} Splitia. {t('app.tagline')}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
