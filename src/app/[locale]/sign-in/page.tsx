'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

// Separate component to handle search params (must be wrapped in Suspense)
function SignInForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const { signIn, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    try {
      const { error, success } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (success) {
        // Redirect to dashboard or original destination
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(t('auth.signInError'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8 bg-card rounded-2xl p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('app.name')}</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.signIn')}</p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium"
                >
                  {t('auth.password')}
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? t('common.loading') : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm">
            {t('auth.noAccount')}{' '}
            <Link href="/sign-up" className="text-primary hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
} 