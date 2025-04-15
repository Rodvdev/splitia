'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, SplitSquareVertical, Users } from 'lucide-react';
import { useLocale } from '@/i18n/client';

export function HeroSection() {
  const router = useRouter();
  const { t, locale } = useLocale();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>
      
      <div className="container relative mx-auto px-4 py-20 sm:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              {t('hero.title')}
              <span className="text-primary"> Splitia</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0">
              {t('hero.subtitle')}
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => router.push(`/${locale}/chat`)}>
                {t('hero.getStarted')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push(`/${locale}/about`)}>
                {t('hero.learnMore')}
              </Button>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>{t('hero.feature1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <SplitSquareVertical className="h-5 w-5 text-primary" />
                <span>{t('hero.feature2')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>{t('hero.feature3')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="relative z-10 w-full max-w-lg mx-auto">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                  <div className="text-center p-6">
                    <div className="text-primary text-4xl font-bold mb-2">Splitia</div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {t('hero.previewAlt')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-40">
                <div className="text-sm font-medium">{t('hero.statTitle')}</div>
                <div className="text-2xl font-bold text-primary">+50%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('hero.statDesc')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 