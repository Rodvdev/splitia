'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createUser } from '@/lib/auth/server-actions';
import { signIn } from 'next-auth/react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
// Componente interno que usa useSearchParams
function SignUpForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('PEN');
  const [language, setLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get the callback URL and email from URL parameters
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const emailParam = searchParams?.get('email') || '';

  // Set the email from URL parameter when component loads
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const currencies = [
    { value: 'PEN', label: 'Sol Peruano (S/)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'MXN', label: 'Peso Mexicano ($)' },
    { value: 'COP', label: 'Peso Colombiano ($)' },
    { value: 'ARS', label: 'Peso Argentino ($)' },
    { value: 'BRL', label: 'Real Brasileño (R$)' },
    { value: 'CLP', label: 'Peso Chileno ($)' },
    { value: 'UYU', label: 'Peso Uruguayo ($)' },
    { value: 'PYG', label: 'Guaraní Paraguayo (₲)' },
    { value: 'VEF', label: 'Bolívar Venezolano (Bs.S)' },
    { value: 'GBP', label: 'Libra Esterlina (£)' },
    { value: 'CAD', label: 'Dólar Canadiense ($)' },
    { value: 'CHF', label: 'Franco Suizo (CHF)' },
    { value: 'AUD', label: 'Dólar Australiano ($)' },
    { value: 'NZD', label: 'Dólar Neozelandés ($)' },
    { value: 'JPY', label: 'Yen Japonés (¥)' },
  ];

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
  ];

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      setIsLoading(false);
      return;
    }
    
    try {
      // Use the server action to create a user
      const { user, error: serverError } = await createUser(email, password, name, lastName, currency, language);
      
      if (serverError) {
        setError(serverError.message);
        setIsLoading(false);
        return;
      }
      
      // Show success message with user info
      setSuccessMessage(`${t('auth.accountCreated')} ${user?.id}`);
      
      // Now sign in the user with NextAuth (client-side)
      try {
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        
        if (signInResult?.error) {
          console.error('NextAuth sign in error:', signInResult.error);
          throw new Error(signInResult.error);
        }
        
        // Redirect to the callback URL after successful signup
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1500);
        
      } catch (signInError) {
        console.error('NextAuth sign in error:', signInError);
        // Continue even if NextAuth login fails as we have the server-side session
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1500);
      }
      
    } catch (err) {
      console.error('Sign up error:', err);
      setError(t('auth.signUpError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <div className={cn("bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700")}>
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t('app.name')}</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.createAccount')}</p>
          {callbackUrl.includes('join') && (
            <p className="mt-2 text-sm text-primary font-medium">
              {t('auth.signUpToJoinGroup') || 'Sign up to join the group'}
            </p>
          )}
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
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-foreground"
                placeholder={t('auth.namePlaceholder')}
              />
            </div>
            
            <div>
              <label 
                htmlFor="lastName" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.lastName')}
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-foreground"
                placeholder={t('auth.lastNamePlaceholder')}
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
                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-foreground"
                placeholder="email@example.com"
                disabled={!!emailParam} // Disable if email is provided in URL
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
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-foreground"
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
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-foreground"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="relative">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10 bg-white text-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="relative">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium mb-1"
              >
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10 bg-white text-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : null}
            {isLoading ? t('common.loading') : t('auth.signUp')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>

  );
}

// Componente de carga para mostrar mientras el componente está suspendido
function SignUpLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Cargando...</p>
      </div>
    </div>
  );
}

// Componente principal envuelto en Suspense
export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoadingFallback />}>
      <SignUpForm />
    </Suspense>
  );
} 