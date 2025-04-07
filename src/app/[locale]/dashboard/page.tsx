'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  ArrowRight, 
  Users, 
  Receipt, 
  CreditCard, 
  Clock 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { fetchExpenses, fetchUserGroups } from '@/lib/graphql-client';
import { formatCurrency } from '@/lib/format';

// Type definitions
interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: {
    id: string;
    name: string;
    image?: string;
  };
  group?: {
    id: string;
    name: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export default function DashboardPage() {
  const t = useTranslations();
  const tExpenses = useTranslations('expenses');
  const tGroups = useTranslations('groups');
  const tSettings = useTranslations('settings');
  const tDashboard = useTranslations('dashboard');
  const tDate = useTranslations('date');
  const tApp = useTranslations('app');
  const tUser = useTranslations('user');
  const tGreetings = useTranslations('greetings');
  const tErrors = useTranslations('errors');
  const tNavigation = useTranslations('navigation');
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userCurrency, setUserCurrency] = useState<string>('');
  const [userLanguage, setUserLanguage] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const supabase = createClient();
  
  // Fetch user profile
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
        toast.error(tErrors('fetchProfile') || 'Error fetching your profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, supabase, t, tErrors]);
  
  // Fetch expenses and groups
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch expenses
        setIsLoadingExpenses(true);
        const expensesData = await fetchExpenses({ limit: 5 }) as { expenses: Expense[] };
        setExpenses(expensesData.expenses || []);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoadingExpenses(false);
      }
      
      try {
        // Fetch groups
        setIsLoadingGroups(true);
        const groupsData = await fetchUserGroups() as { userGroups: Group[] };
        setGroups(groupsData.userGroups || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleAddExpense = () => {
    router.push('/dashboard/expenses/create');
  };
  
  const handleCreateGroup = () => {
    router.push('/dashboard/groups/create');
  };
  
  const handleViewAllExpenses = () => {
    router.push('/dashboard/expenses');
  };
  
  const handleViewAllGroups = () => {
    router.push('/dashboard/groups');
  };
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (userLanguage === 'en') {
      if (hour < 12) return tGreetings('morning');
      if (hour < 19) return tGreetings('afternoon');
      return tGreetings('evening');
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
  
  // Calculate total expenses in user currency
  const getTotalExpenses = () => {
    if (!expenses.length) return 0;
    
    // Only consider expenses in the user's currency for simplicity
    // In a real app, you would convert currencies
    return expenses
      .filter(expense => expense.currency === userCurrency)
      .reduce((total, expense) => total + expense.amount, 0);
  };
  
  // Format date to relative time (today, yesterday, or date)
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return tDate('today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return tDate('yesterday');
    } else {
      return new Intl.DateTimeFormat(userLanguage === 'en' ? 'en-US' : 'es-ES', {
        month: 'short',
        day: 'numeric'
      }).format(date);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl text-muted-foreground">
            {!isLoading && `${getGreeting()}, ${userName || tUser('guest')}`}
            {isLoading && <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>}
          </h2>
          <h1 className="text-3xl font-bold text-foreground">
            {tNavigation('dashboard')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {tApp('tagline')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Expenses Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-primary" />
                {tExpenses('title')}
              </span>
              <Badge variant="outline" className="ml-2">
                {expenses.length} {tExpenses('total')}
              </Badge>
            </CardTitle>
            <CardDescription>{tExpenses('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">
                {isLoadingExpenses ? (
                  <Skeleton className="h-8 w-36" />
                ) : (
                  formatCurrency(getTotalExpenses(), userCurrency)
                )}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewAllExpenses}
            >
              {tExpenses('viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="sm"
              onClick={handleAddExpense}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tExpenses('add')}
            </Button>
          </CardFooter>
        </Card>

        {/* Groups Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                {tGroups('title')}
              </span>
              <Badge variant="outline" className="ml-2">
                {groups.length} {tGroups('total')}
              </Badge>
            </CardTitle>
            <CardDescription>{tGroups('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {isLoadingGroups ? (
                <div className="flex gap-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-10 w-10 rounded-full" />
                  ))}
                </div>
              ) : groups.length > 0 ? (
                <div className="flex -space-x-2">
                  {groups.slice(0, 4).map(group => (
                    <Avatar key={group.id} className="border-2 border-background">
                      {group.image ? (
                        <AvatarImage src={group.image} alt={group.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(group.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {groups.length > 4 && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted border-2 border-background text-xs">
                      +{groups.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center">{tGroups('empty')}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewAllGroups}
            >
              {tGroups('viewAll')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="sm"
              onClick={handleCreateGroup}
            >
              <Plus className="mr-2 h-4 w-4" />
              {tGroups('create')}
            </Button>
          </CardFooter>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              {tSettings('title')}
            </CardTitle>
            <CardDescription>{tSettings('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {tSettings('language')}
                </span>
                <span className="font-medium">
                  {isLoading ? 
                    <Skeleton className="h-5 w-20" /> : 
                    getLanguageName(userLanguage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {tSettings('currency')}
                </span>
                <span className="font-medium">
                  {isLoading ? 
                    <Skeleton className="h-5 w-16" /> : 
                    userCurrency}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push('/profile')}
            >
              {tSettings('profile')}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          {tDashboard('recentActivity')}
        </h2>
        
        <div className="space-y-4">
          {isLoadingExpenses ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </Card>
            ))
          ) : expenses.length > 0 ? (
            // Expenses list
            expenses.map(expense => (
              <Card key={expense.id} className="overflow-hidden hover:shadow-md cursor-pointer transition-shadow" onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {expense.paidBy.image ? (
                        <AvatarImage src={expense.paidBy.image} alt={expense.paidBy.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(expense.paidBy.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{formatRelativeDate(expense.date)}</span>
                        {expense.group && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {expense.group.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">{tExpenses('noExpenses')}</p>
              <Button 
                className="mt-4"
                onClick={handleAddExpense}
              >
                <Plus className="mr-2 h-4 w-4" />
                {tExpenses('add')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 