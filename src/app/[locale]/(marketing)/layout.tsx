'use client';

import { useLocale } from '@/i18n/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { FooterThemeSelector } from '@/components/ui/footer-theme-selector';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  const { locale, t } = useLocale();
  const router = useRouter();

  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  const handleSignup = () => {
    router.push(`/${locale}/sign-up`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 w-full py-4 px-6 border-b flex items-center justify-between bg-white/80 backdrop-blur-md dark:bg-gray-950/80">
        <div className="flex items-center">
          <Link href={`/${locale}`} className="flex items-center">
            <div className="w-8 h-8 mr-2 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="text-2xl font-bold">Splitia</span>
          </Link>
          
          <nav className="hidden md:flex ml-10 space-x-8">
            <Link href={`/${locale}/features`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('navigation.features')}
            </Link>
            <Link href={`/${locale}/pricing`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('navigation.pricing')}
            </Link>
            <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors">
              {t('navigation.about')}
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogin}>{t('auth.login')}</Button>
          <Button onClick={handleSignup}>{t('auth.signup')}</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Marketing Footer */}
      <footer className="border-t py-12 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href={`/${locale}`} className="flex items-center mb-4">
              <span className="text-xl font-bold">Splitia</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">{t('footer.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/features`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.features')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/pricing`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.pricing')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/about`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/terms`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
            
            <FooterThemeSelector />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Splitia. {t('footer.rights')}
          </p>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <span className="sr-only">Twitter</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <span className="sr-only">LinkedIn</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <span className="sr-only">GitHub</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                <path d="M9 18c-4.51 2-5-2-7-2"></path>
              </svg>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
} 