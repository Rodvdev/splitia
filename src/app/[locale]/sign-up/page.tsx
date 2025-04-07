'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    
    try {
      const { error, success } = await signUp(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (success) {
        // Redirect to verification page or show success message
        router.push('/sign-up/verification');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError(t('auth.signUpError'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8 bg-card rounded-2xl p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('app.name')}</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.createAccount')}</p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
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
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.password')}
              </label>
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
            
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? t('common.loading') : t('auth.signUp')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm">
            {t('auth.haveAccount')}{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 