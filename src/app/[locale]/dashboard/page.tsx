'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userCurrency, setUserCurrency] = useState<string>('');
  const [userLanguage, setUserLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/sign-in');
          return;
        }
        
        // Fetch user profile from database
        const response = await fetch('/api/profile/get', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserName(data.user.name || '');
            setUserCurrency(data.user.currency || 'PEN');
            setUserLanguage(data.user.language || 'es');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error(t('errors.fetchProfile') || 'Error fetching your profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, supabase, t]);
  
  const handleAddExpense = () => {
    router.push('/dashboard/expenses/create');
  };
  
  const handleCreateGroup = () => {
    router.push('/dashboard/groups/create');
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    // Determinar el saludo según el idioma del usuario y la hora del día
    if (userLanguage === 'en') {
      if (hour < 12) return 'Good morning';
      if (hour < 19) return 'Good afternoon';
      return 'Good evening';
    } else if (userLanguage === 'pt') {
      if (hour < 12) return 'Bom dia';
      if (hour < 19) return 'Boa tarde';
      return 'Boa noite';
    } else {
      // Español por defecto
      if (hour < 12) return 'Buenos días';
      if (hour < 19) return 'Buenas tardes';
      return 'Buenas noches';
    }
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'pt': return 'Português';
      default: return code;
    }
  };
  
  // Obtener la palabra "invitado" según el idioma del usuario
  const getGuestText = () => {
    if (userLanguage === 'en') return 'guest';
    if (userLanguage === 'pt') return 'convidado';
    return 'invitado'; // Español por defecto
  };
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl text-muted-foreground">
            {!isLoading && `${getGreeting()}, ${userName || getGuestText()}`}
            {isLoading && <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>}
          </h2>
          <h1 className="text-3xl font-bold text-foreground">
            {t('navigation.dashboard')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('app.tagline')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {t('expenses.title')}
          </h2>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{userCurrency} 0.00</span>
            <button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium"
              onClick={handleAddExpense}
            >
              {t('expenses.add')}
            </button>
          </div>
        </div>

        {/* Groups Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {t('groups.title')}
          </h2>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">0</span>
            <button 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium"
              onClick={handleCreateGroup}
            >
              {t('groups.create')}
            </button>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {t('settings.title')}
          </h2>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t('settings.language')}
              </span>
              <span className="font-medium">
                {isLoading ? 
                  <div className="h-5 w-20 bg-muted animate-pulse rounded"></div> : 
                  getLanguageName(userLanguage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t('settings.currency')}
              </span>
              <span className="font-medium">
                {isLoading ? 
                  <div className="h-5 w-16 bg-muted animate-pulse rounded"></div> : 
                  userCurrency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 