'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Plus, 
  Users, 
  Receipt, 
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Globe 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { fetchExpenses, fetchUserGroups } from '@/lib/graphql-client';
import { formatCurrency } from '@/lib/format';
import { getSession } from 'next-auth/react'
import { cn } from '@/lib/utils';

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

interface Member {
  id: string;
  name: string;
  image?: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string;
  members?: Member[];
}

export default function DashboardPage() {
  const tExpenses = useTranslations('expenses');
  const tGroups = useTranslations('groups');
  const tDashboard = useTranslations('dashboard');
  const tDate = useTranslations('date');
  const tApp = useTranslations('app');
  const tErrors = useTranslations('errors');
  const tNavigation = useTranslations('navigation');
  const router = useRouter();
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [userLanguage, setUserLanguage] = useState<string>('en');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  
  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingExpenses(true);
        
        // Get current session
        const session = await getSession();
        
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
            setUserCurrency(data.user.currency || 'PEN');
            setUserLanguage(data.user.language || 'es');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error(tErrors('fetchProfile') || 'Error fetching your profile');
      } finally {
        setIsLoadingExpenses(false);
      }
    };
    
    fetchUserProfile();
  }, [router, tErrors]);
  
  const fetchData = useCallback(async () => {
    try {
      setIsLoadingExpenses(true);
      setError(null);
      const expensesData = await fetchExpenses({ limit: 5 }) as { expenses: Expense[] };
      setExpenses(expensesData.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
      toast.error(tErrors('fetchExpenses') || 'Error al cargar los gastos');
    } finally {
      setIsLoadingExpenses(false);
    }
    
    try {
      setIsLoadingGroups(true);
      const groupsData = await fetchUserGroups() as { userGroups: Group[] };
      setGroups(groupsData.userGroups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error(tErrors('fetchGroups') || 'Error al cargar los grupos');
    } finally {
      setIsLoadingGroups(false);
    }
  }, [tErrors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleAddExpense = () => {
    // Si hay un grupo seleccionado (índice diferente de -1), incluir su ID en la URL
    const currentGroup = currentGroupIndex >= 0 ? groups[currentGroupIndex] : null;
    const url = currentGroup 
      ? `/dashboard/expenses/create?groupId=${currentGroup.id}`
      : '/dashboard/expenses/create';
    
    router.push(url);
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

  
  // Calculate total expenses in user currency
  const getTotalExpenses = () => {
    if (!filteredExpenses.length) return 0;
    
    // Only consider expenses in the user's currency for simplicity
    // In a real app, you would convert currencies
    return filteredExpenses
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
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Currency formatting with locale
  const formatUserCurrency = (amount: number, currencyCode: string) => {
    return formatCurrency(amount, currencyCode, {
      locale: userLanguage === 'en' ? 'en-US' : 
             userLanguage === 'es' ? 'es-ES' : 
             userLanguage === 'pt' ? 'pt-BR' : 'en-US'
    });
  };
  
  // Update filtered expenses when current group changes
  useEffect(() => {
    if (!expenses.length) {
      setFilteredExpenses([]);
      return;
    }

    // Si el índice es -1 (TODOS) o no hay grupos, mostrar todos los gastos
    if (currentGroupIndex === -1 || !groups.length) {
      setFilteredExpenses(expenses);
      return;
    }

    const currentGroup = groups[currentGroupIndex];
    if (currentGroup) {
      const groupExpenses = expenses.filter(expense => expense.group?.id === currentGroup.id);
      setFilteredExpenses(groupExpenses);
    }
  }, [currentGroupIndex, expenses, groups]);

  // Obtener todos los miembros únicos de todos los grupos
  useEffect(() => {
    const uniqueMembers = new Map<string, Member>();
    groups.forEach(group => {
      group.members?.forEach(member => {
        uniqueMembers.set(member.id, member);
      });
    });
    setAllMembers(Array.from(uniqueMembers.values()));
  }, [groups]);

  const getCurrentMembers = () => {
    if (currentGroupIndex === -1) {
      return allMembers;
    }
    return groups[currentGroupIndex]?.members || [];
  };

  const handlePreviousGroup = () => {
    setCurrentGroupIndex(prev => (prev > 0 ? prev - 1 : groups.length - 1));
  };

  const handleNextGroup = () => {
    setCurrentGroupIndex(prev => (prev < groups.length - 1 ? prev + 1 : 0));
  };

  const handleGroupClick = (index: number) => {
    setCurrentGroupIndex(index);
  };

  const truncateName = (name: string, maxLength: number = 9) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground mt-4">
            {tNavigation('dashboard')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {tApp('tagline')}
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive mb-6">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setError(null);
              setIsLoadingExpenses(true);
              setIsLoadingGroups(true);
              fetchData();
            }}
          >
            Intentar de nuevo
          </Button>
        </div>
      ) : (
        <>
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-10">
            <Button 
              size="lg" 
              className="flex-1 sm:flex-none"
              onClick={handleAddExpense}
            >
              <Plus className="mr-2 h-5 w-5" />
              {tExpenses('add')}
            </Button>
            <Button 
              size="lg" 
              className="flex-1 sm:flex-none"
              onClick={handleCreateGroup}
            >
              <Users className="mr-2 h-5 w-5" />
              {tGroups('create')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Groups Card */}
            <Card className="border-0 shadow-sm">
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
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousGroup}
                    disabled={groups.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex justify-center items-center gap-4 py-2">
                    {isLoadingGroups ? (
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-16 w-16 rounded-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        {/* Opción TODOS */}
                        <button
                          onClick={() => handleGroupClick(-1)}
                          className={cn(
                            "transition-all duration-200 relative",
                            currentGroupIndex === -1 ? "scale-100" : "scale-75 opacity-50"
                          )}
                        >
                          <Avatar 
                            className={cn(
                              "h-16 w-16 border-2",
                              currentGroupIndex === -1 ? "border-primary" : "border-muted"
                            )}
                          >
                            <AvatarFallback className={cn(
                              "text-lg",
                              currentGroupIndex === -1 ? "bg-primary/10 text-primary" : ""
                            )}>
                              <Globe className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <span className={cn(
                            "text-xs mt-1 block text-center truncate max-w-[80px]",
                            currentGroupIndex === -1 ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            TODOS
                          </span>
                        </button>

                        {groups.map((group, index) => {
                          const isVisible = Math.abs(index - currentGroupIndex) <= 1;
                          const isCurrent = index === currentGroupIndex;

                          if (!isVisible && currentGroupIndex !== -1) return null;

                          return (
                            <button
                              key={group.id}
                              onClick={() => handleGroupClick(index)}
                              className={cn(
                                "transition-all duration-200 relative",
                                isCurrent ? "scale-100" : "scale-75 opacity-50"
                              )}
                            >
                              <Avatar 
                                className={cn(
                                  "h-16 w-16 border-2",
                                  isCurrent ? "border-primary" : "border-muted"
                                )}
                              >
                                {group.image ? (
                                  <AvatarImage src={group.image} alt={group.name} />
                                ) : null}
                                <AvatarFallback className={cn(
                                  "text-lg",
                                  isCurrent ? "bg-primary/10 text-primary" : ""
                                )}>
                                  {getInitials(group.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className={cn(
                                "text-xs mt-1 block text-center truncate max-w-[80px]",
                                isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                              )}>
                                {group.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextGroup}
                    disabled={groups.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                  onClick={handleViewAllGroups}
                >
                  Ver todos
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>

            {/* Expenses Summary Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2 text-primary" />
                    {groups[currentGroupIndex] 
                      ? `${tExpenses('title')} - ${groups[currentGroupIndex].name}`
                      : tExpenses('title')}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {filteredExpenses.length} {tExpenses('total')}
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
                      formatUserCurrency(getTotalExpenses(), userCurrency)
                    )}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-auto"
                  onClick={handleViewAllExpenses}
                >
                  Ver todos
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>


            {/* Members Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    Miembros
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {getCurrentMembers().length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentGroupIndex === -1 
                    ? "Todos los miembros de tus grupos"
                    : `Miembros de ${groups[currentGroupIndex]?.name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {getCurrentMembers().map(member => (
                    <div key={member.id} className="flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1">
                      <Avatar className="h-6 w-6">
                        {member.image ? (
                          <AvatarImage src={member.image} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {truncateName(member.name)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Recent Activity Section - Update to use filteredExpenses */}
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              {tDashboard('recentActivity')}
              {groups[currentGroupIndex] && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({groups[currentGroupIndex].name})
                </span>
              )}
            </h2>
            
            <div className="space-y-4">
              {isLoadingExpenses ? (
                // Loading skeletons
                Array(3).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-sm">
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
              ) : filteredExpenses.length > 0 ? (
                // Expenses list
                filteredExpenses.map(expense => (
                  <Card key={expense.id} className="overflow-hidden hover:shadow-md cursor-pointer transition-shadow border-0" onClick={() => router.push(`/dashboard/expenses/${expense.id}`)}>
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
                        {formatUserCurrency(expense.amount, expense.currency)}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                // Empty state
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    {groups[currentGroupIndex] 
                      ? `No hay gastos en ${groups[currentGroupIndex].name}`
                      : tExpenses('noExpenses')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 