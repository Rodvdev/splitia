'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { locales, defaultLocale } from '@/i18n/config';
import { HeroSection } from '@/components/HeroSection';
import { 
  Users, 
  User, 
  PiggyBank, 
  TrendingUp,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Function to handle login
  const handleLogin = () => {
    const preferredLanguage = navigator.language.split('-')[0];
    const supportedLang = locales.includes(preferredLanguage as (typeof locales)[number]) 
      ? preferredLanguage 
      : defaultLocale;
    
    router.push(`/${supportedLang}/login`);
  };

  // Function to handle signup
  const handleSignup = () => {
    const preferredLanguage = navigator.language.split('-')[0];
    const supportedLang = locales.includes(preferredLanguage as (typeof locales)[number]) 
      ? preferredLanguage 
      : defaultLocale;
    
    router.push(`/${supportedLang}/sign-up`);
  };

  // Render landing page with hero section and features
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Landing Page Header */}
      <header className="py-4 px-6 border-b flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Splitia</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleLogin}>Iniciar sesión</Button>
          <Button onClick={handleSignup}>Crear cuenta</Button>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">¿Qué puedes hacer con Splitia?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Split Feature */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-blue-100 dark:border-gray-700" 
              data-feature="split"
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit mb-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Split</h3>
              <p className="text-muted-foreground mb-4">Divide gastos fácilmente entre amigos, familiares o compañeros de piso.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${defaultLocale}/dashboard/groups`)}>
                Empezar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Solo Feature */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-green-100 dark:border-gray-700" 
              data-feature="solo"
            >
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mb-4">
                <User className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Solo</h3>
              <p className="text-muted-foreground mb-4">Gestiona tus gastos personales y mantén un seguimiento de tus finanzas.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${defaultLocale}/dashboard/expenses`)}>
                Empezar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* CashUp Feature */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-purple-100 dark:border-gray-700" 
              data-feature="cashup"
            >
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-fit mb-4">
                <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">CashUp</h3>
              <p className="text-muted-foreground mb-4">Establece presupuestos mensuales y recibe análisis de tus hábitos de gasto.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${defaultLocale}/dashboard/budget`)}>
                Empezar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Chat Feature */}
            <div 
              className="action-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all cursor-pointer border border-amber-100 dark:border-gray-700" 
              data-feature="chat"
            >
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Chat</h3>
              <p className="text-muted-foreground mb-4">Comunícate con tus grupos y obtén consejos financieros con nuestro asistente IA.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${defaultLocale}/dashboard/chat`)}>
                Empezar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">¿Por qué elegir Splitia?</h2>
          <p className="text-xl text-muted-foreground mb-12">Splitia simplifica la gestión financiera compartida con herramientas intuitivas y poderosas.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sin discusiones</h3>
              <p className="text-muted-foreground">Evita malentendidos con cálculos precisos de quién debe qué a quién.</p>
            </div>
            
            <div className="p-6">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <PiggyBank className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Más ahorro</h3>
              <p className="text-muted-foreground">Visualiza tus gastos para identificar áreas donde puedes reducir y ahorrar más.</p>
            </div>
            
            <div className="p-6">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Mejores finanzas</h3>
              <p className="text-muted-foreground">Toma mejores decisiones financieras con análisis inteligentes y recomendaciones.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Comienza tu experiencia Splitia hoy</h2>
          <p className="text-xl text-muted-foreground mb-8">Únete a miles de personas que ya confían en Splitia para simplificar sus finanzas compartidas.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleSignup}>
              Crear cuenta gratuita
            </Button>
            <Button size="lg" variant="outline" onClick={handleLogin}>
              Iniciar sesión
            </Button>
          </div>
        </div>
      </section>
      
      <footer className="py-8 px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Splitia</h2>
              <p className="text-sm text-muted-foreground">Simplicidad financiera en tu mano</p>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Splitia. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

