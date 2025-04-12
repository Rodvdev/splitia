'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/config';
import { 
  Users, 
  User, 
  PiggyBank, 
  TrendingUp 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Function to detect user's preferred language
    const detectUserLanguage = () => {
      // Check browser's language preference
      const browserLang = navigator.language.split('-')[0];
      
      // See if browser language is in our supported locales
      const supportedLang = locales.includes(browserLang as (typeof locales)[number]) 
        ? browserLang 
        : defaultLocale;
        
      return supportedLang;
    };

    // Handle navigation to a specific feature
    const handleFeatureClick = (feature: string) => {
      const preferredLanguage = detectUserLanguage();
      
      switch (feature) {
        case 'split':
          router.push(`/${preferredLanguage}/dashboard/groups`);
          break;
        case 'solo':
          router.push(`/${preferredLanguage}/dashboard/expenses`);
          break;
        case 'cashup':
          router.push(`/${preferredLanguage}/dashboard/budget`);
          break;
        case 'investify':
          // This might be a future feature
          router.push(`/${preferredLanguage}/dashboard`);
          break;
        default:
          router.push(`/${preferredLanguage}/dashboard`);
      }
    };

    // Add click event listeners to action cards
    const actionElements = document.querySelectorAll('.action-card');
    actionElements.forEach(element => {
      const feature = element.getAttribute('data-feature');
      if (feature) {
        element.addEventListener('click', () => handleFeatureClick(feature));
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      actionElements.forEach(element => {
        const feature = element.getAttribute('data-feature');
        if (feature) {
          element.removeEventListener('click', () => handleFeatureClick(feature));
        }
      });
    };
  }, [router]);

  // Render mobile UI with 4 main actions
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <header className="py-6 px-6">
        <h1 className="text-3xl font-bold text-center">Splitia</h1>
        <p className="text-center text-muted-foreground mt-2">Gestión financiera simplificada</p>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-6">¿Qué quieres hacer hoy?</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Split */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-100 dark:border-gray-700" 
              data-feature="split"
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mb-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-bold">Split</h3>
              <p className="text-sm text-muted-foreground mt-1">Divide gastos en grupo</p>
            </div>
            
            {/* Solo */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-green-100 dark:border-gray-700" 
              data-feature="solo"
            >
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mb-3">
                <User className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="font-bold">Solo</h3>
              <p className="text-sm text-muted-foreground mt-1">Tus gastos personales</p>
            </div>
            
            {/* CashUp */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-purple-100 dark:border-gray-700" 
              data-feature="cashup"
            >
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-fit mb-3">
                <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-bold">CashUp</h3>
              <p className="text-sm text-muted-foreground mt-1">Control financiero</p>
            </div>
            
            {/* Investify */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-100 dark:border-gray-700" 
              data-feature="investify"
            >
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full w-fit mb-3">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="font-bold">Investify</h3>
              <p className="text-sm text-muted-foreground mt-1">Inversión inteligente</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Simplicidad financiera en tu mano
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-4 px-6 text-center">
        <span className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Splitia
        </span>
      </footer>
    </div>
  );
}
