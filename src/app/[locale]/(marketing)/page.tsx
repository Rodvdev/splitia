'use client';

import { HeroSection } from '@/components/HeroSection';
import { useLocale } from '@/i18n/client';
import { 
  Users, 
  User, 
  PiggyBank, 
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { locale, t } = useLocale();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push(`/${locale}/sign-up`);
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('features.title')}</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Group Expenses Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.group.title')}</h3>
              <p className="text-muted-foreground">{t('features.group.description')}</p>
            </div>
            
            {/* Personal Finances Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.personal.title')}</h3>
              <p className="text-muted-foreground">{t('features.personal.description')}</p>
            </div>
            
            {/* Budgeting Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <PiggyBank className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.budget.title')}</h3>
              <p className="text-muted-foreground">{t('features.budget.description')}</p>
            </div>
            
            {/* Multi-currency Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.currency.title')}</h3>
              <p className="text-muted-foreground">{t('features.currency.description')}</p>
            </div>
            
            {/* Communication Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.chat.title')}</h3>
              <p className="text-muted-foreground">{t('features.chat.description')}</p>
            </div>
            
            {/* AI Feature */}
            <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -top-1 -right-1">
                <span className="bg-primary text-primary-foreground text-xs font-bold py-1 px-2 rounded-bl-lg">
                  PREMIUM
                </span>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t('features.ai.title')}</h3>
              <p className="text-muted-foreground">{t('features.ai.description')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it Works Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('how.title')}</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('how.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('how.step1.title')}</h3>
              <p className="text-muted-foreground">{t('how.step1.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('how.step2.title')}</h3>
              <p className="text-muted-foreground">{t('how.step2.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('how.step3.title')}</h3>
              <p className="text-muted-foreground">{t('how.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('testimonials.title')}</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 border">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <Image
                    src="/testimonial-1.jpg"
                    alt="Testimonial"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Maria G.</h4>
                  <p className="text-sm text-muted-foreground">Estudiante</p>
                </div>
              </div>
              <p className="italic text-muted-foreground">&ldquo;{t('testimonials.quote1')}&rdquo;</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <Image
                    src="/testimonial-2.jpg"
                    alt="Testimonial"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Carlos M.</h4>
                  <p className="text-sm text-muted-foreground">Profesional</p>
                </div>
              </div>
              <p className="italic text-muted-foreground">&ldquo;{t('testimonials.quote2')}&rdquo;</p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <Image
                    src="/testimonial-3.jpg"
                    alt="Testimonial"
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold">Ana P.</h4>
                  <p className="text-sm text-muted-foreground">Viajera</p>
                </div>
              </div>
              <p className="italic text-muted-foreground">&ldquo;{t('testimonials.quote3')}&rdquo;</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t('pricing.title')}</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-card rounded-xl p-8 border hover:shadow-md transition-shadow">
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold mb-2">{t('pricing.free.title')}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground"> / {t('pricing.month')}</span>
                </div>
              </div>
              
              <div className="border-t border-b py-6 my-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.free.feature1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.free.feature2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.free.feature3')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button onClick={handleGetStarted} className="w-full">
                  {t('pricing.free.cta')}
                </Button>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="bg-card rounded-xl p-8 border border-primary hover:shadow-md transition-shadow relative">
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold py-1 px-3 rounded-full">
                  {t('pricing.popular')}
                </span>
              </div>
              
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold mb-2">{t('pricing.premium.title')}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground"> / {t('pricing.month')}</span>
                </div>
              </div>
              
              <div className="border-t border-b py-6 my-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.premium.feature1')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.premium.feature2')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.premium.feature3')}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>{t('pricing.premium.feature4')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button onClick={handleGetStarted} className="w-full" variant="default">
                  {t('pricing.premium.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('cta.subtitle')}
          </p>
          
          <Button size="lg" onClick={handleGetStarted}>
            {t('cta.button')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
} 