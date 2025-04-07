'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  
  const handleAddExpense = () => {
    router.push('/dashboard/expenses/create');
  };
  
  const handleCreateGroup = () => {
    router.push('/dashboard/groups/create');
  };
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          {t('navigation.dashboard')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('app.tagline')}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {t('expenses.title')}
          </h2>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">$0.00</span>
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
              <span className="font-medium">English</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {t('settings.currency')}
              </span>
              <span className="font-medium">USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 