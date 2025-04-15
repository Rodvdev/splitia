'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signInUser } from '@/lib/auth/server-actions';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Separate component to handle search params (must be wrapped in Suspense)
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

// Main component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-60"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignInForm />
    </Suspense>
  );
} 