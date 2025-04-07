'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { authActions } from '@/lib/auth/auth-actions';

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      setIsLoading(false);
      return;
    }
    
    try {
      const { error } = await authActions.signUp(email, password);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Show success message
      setSuccessMessage(t('auth.checkEmail'));
      
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push('/sign-in');
      }, 5000);
      
    } catch (err) {
      console.error('Sign up error:', err);
      setError(t('auth.signUpError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8 bg-card rounded-2xl p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('app.name')}</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.signUp')}</p>
        </div>
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-success/10 text-success p-4 rounded-lg text-sm">
            {successMessage}
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
                htmlFor="confirm-password" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirm-password"
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
            {t('auth.hasAccount')}{' '}
            <Link href="/sign-in" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 