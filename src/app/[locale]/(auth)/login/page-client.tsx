'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Users, SplitSquareVertical, CreditCard, Loader2, User, Shield, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signInUser } from '@/lib/auth/server-actions';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Separate component to handle search params
function SignInForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');
  const redirectTo = callbackUrl || searchParams?.get('redirectTo') || '/dashboard';
  
  // Pre-fill email if provided in query params
  const emailParam = searchParams?.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCredential, setCopiedCredential] = useState<string | null>(null);

  // Demo credentials
  const demoCredentials = {
    user: {
      email: 'user@demo.com',
      password: 'demo123',
      label: 'Demo User'
    },
    admin: {
      email: 'admin@demo.com',
      password: 'admin123',
      label: 'Demo Admin'
    }
  };

  const handleUseDemoCredentials = (type: 'user' | 'admin') => {
    const creds = demoCredentials[type];
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  const handleCopyCredential = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCredential(type);
      setTimeout(() => setCopiedCredential(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // First try to sign in with NextAuth (client-side)
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: redirectTo,
      });

      // If NextAuth login fails
      if (result?.error) {
        // Fall back to server-side auth as a backup
        const { error: serverError } = await signInUser(email, password);
        
        if (serverError) {
          setError(serverError.message);
          setIsLoading(false);
          return;
        }
      }
      
      // Redirect to dashboard or original destination
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(t('auth.signInError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.signIn')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {t('auth.signInDescription') || "Ingresa tus credenciales para continuar"}
        </p>
      </div>

      {/* Demo Credentials Section */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Demo Credentials</h3>
        </div>
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
          Use these credentials to test the application
        </p>
        
        <div className="space-y-3">
          {/* Demo User */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{demoCredentials.user.label}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUseDemoCredentials('user')}
                className="h-7 text-xs"
              >
                Use
              </Button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <div className="flex items-center gap-1">
                  <code className="text-gray-900 dark:text-gray-100 font-mono">{demoCredentials.user.email}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential(demoCredentials.user.email, 'user-email')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {copiedCredential === 'user-email' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Password:</span>
                <div className="flex items-center gap-1">
                  <code className="text-gray-900 dark:text-gray-100 font-mono">{demoCredentials.user.password}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential(demoCredentials.user.password, 'user-password')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {copiedCredential === 'user-password' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Admin */}
          <div className="bg-white dark:bg-gray-800 p-3 rounded-md border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{demoCredentials.admin.label}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleUseDemoCredentials('admin')}
                className="h-7 text-xs"
              >
                Use
              </Button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <div className="flex items-center gap-1">
                  <code className="text-gray-900 dark:text-gray-100 font-mono">{demoCredentials.admin.email}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential(demoCredentials.admin.email, 'admin-email')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {copiedCredential === 'admin-email' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Password:</span>
                <div className="flex items-center gap-1">
                  <code className="text-gray-900 dark:text-gray-100 font-mono">{demoCredentials.admin.password}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCredential(demoCredentials.admin.password, 'admin-password')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {copiedCredential === 'admin-password' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-200">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
            disabled={!!emailParam}
            className="bg-gray-50 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-200">{t('auth.password')}</Label>
            <Link 
              href="/forgot-password" 
              className="text-xs text-primary hover:underline dark:text-blue-400"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="bg-gray-50 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full mt-8"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </>
          ) : (
            t('auth.signIn')
          )}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPageClient() {
  const t = useTranslations();
  const pathname = usePathname();
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

  return (
    <>
      {/* Informative section (hidden on mobile) - Full height, directly on screen */}
      <div className="hidden md:flex md:w-1/2 bg-primary dark:bg-gray-900 text-primary-foreground dark:text-white relative">
        {/* Grid pattern background on primary section */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid.svg')] dark:bg-[url('/grid-dark.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        </div>
        
        <div className="flex flex-col justify-center p-12 relative z-10 max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-white">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-xl mb-10 opacity-90 text-white">
            {t('auth.loginInfoText') || "Accede a tu cuenta para gestionar tus gastos compartidos de forma sencilla"}
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
            <Suspense fallback={<div className="flex items-center justify-center h-60"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <SignInForm />
            </Suspense>
            
            {/* Mobile-only links */}
            <div className="mt-6 text-center md:hidden">
              <Link 
                href={getLocalizedPath('/sign-up')} 
                className="text-sm font-medium text-primary hover:underline dark:text-blue-400"
              >
                {t('auth.noAccount')} {t('auth.signUp')}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer inside the right section */}
        <footer className="py-4 px-6 text-center text-sm text-muted-foreground dark:text-gray-400 relative z-10">
          <p>© {new Date().getFullYear()} Splitia. {t('app.tagline')}</p>
        </footer>
      </div>
    </>
  );
} 