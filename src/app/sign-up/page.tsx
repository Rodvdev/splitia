'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createUser } from '@/lib/auth/server-actions';
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const t = useTranslations();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currencies = [
    { value: 'PEN', label: 'Sol Peruano (S/)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'MXN', label: 'Peso Mexicano ($)' },
    { value: 'COP', label: 'Peso Colombiano ($)' },
    { value: 'ARS', label: 'Peso Argentino ($)' },
  ];

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
  ];

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
      // Use the server action to create a user
      const { user, error: serverError } = await createUser(email, password, name, currency, language);
      
      if (serverError) {
        setError(serverError.message);
        setIsLoading(false);
        return;
      }
      
      // Show success message with user info
      setSuccessMessage(`${t('auth.accountCreated')} ${user?.id}`);
      
      // Now sign in the user with NextAuth (client-side)
      try {
        await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
      } catch (signInError) {
        console.error('NextAuth sign in error:', signInError);
        // Continue even if NextAuth sign-in fails as we have the server-side session
      }
      
      // Redirect to dashboard after successful signup
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
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
                htmlFor="name" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                placeholder={t('auth.namePlaceholder')}
              />
            </div>
            
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="currency" 
                  className="block text-sm font-medium mb-1"
                >
                  {t('auth.currency')}
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  {currencies.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label 
                  htmlFor="language" 
                  className="block text-sm font-medium mb-1"
                >
                  {t('auth.language')}
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
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