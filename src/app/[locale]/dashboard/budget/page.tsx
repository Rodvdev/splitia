'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  PieChart, 
  DollarSign, 
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import the centralized formatCurrency function
import { formatCurrency } from '@/lib/format';

// Interface for budget data
interface BudgetCategory {
  id: string;
  name: string;
  amount: number;
  spent: number;
  color?: string;
}

interface Budget {
  id: string;
  month: string;
  year: number;
  income: number;
  savings: number;
  currency: string;
  categories: BudgetCategory[];
}

export default function BudgetPage() {
  const t = useTranslations('budget');
  const router = useRouter();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toLocaleString('default', { month: 'long' })
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Months for the dropdown
  const months = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December'
  ];

  // Mock fetch budget data (replace with actual API call)
  useEffect(() => {
    const loadBudget = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // For now, we'll just use mock data
        // In a real app, you would fetch this from your API
        const mockBudget = {
          id: '1',
          month: selectedMonth,
          year: selectedYear,
          income: 3000,
          savings: 500,
          currency: 'USD',
          categories: [
            { id: '1', name: 'Housing', amount: 1000, spent: 980, color: '#FF6384' },
            { id: '2', name: 'Food', amount: 500, spent: 420, color: '#36A2EB' },
            { id: '3', name: 'Transportation', amount: 200, spent: 180, color: '#FFCE56' },
            { id: '4', name: 'Utilities', amount: 300, spent: 290, color: '#4BC0C0' },
            { id: '5', name: 'Entertainment', amount: 200, spent: 250, color: '#9966FF' },
            { id: '6', name: 'Health', amount: 100, spent: 80, color: '#FF9F40' },
          ]
        };
        
        setBudget(mockBudget);
        setIsLoading(false);
      }, 1000);
    };

    loadBudget();
  }, [selectedMonth, selectedYear]);

  // Calculate total budget stats
  const calculateStats = () => {
    if (!budget) return { totalBudget: 0, totalSpent: 0, remaining: 0 };
    
    const totalBudget = budget.categories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const remaining = totalBudget - totalSpent;
    
    return { totalBudget, totalSpent, remaining };
  };

  const { totalBudget, totalSpent, remaining } = calculateStats();

  // Handle create budget button click
  const handleCreateBudget = () => {
    router.push('/dashboard/budget/create');
  };

  // Format currency helper that uses the budget's currency
  const formatBudgetCurrency = (amount: number) => {
    return formatCurrency(amount, budget?.currency || 'USD', {
      // Optionally pass locale if needed
      // locale: budget?.locale || 'en-US',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleCreateBudget}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      {/* Month and Year Selection */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedMonth}
          onValueChange={setSelectedMonth}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('month')} />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(year) => setSelectedYear(parseInt(year))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {[2022, 2023, 2024, 2025].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        // Loading skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-8 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budget ? (
        <>
          {/* Budget Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary" />
                  {t('income')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatBudgetCurrency(budget.income)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {`${selectedMonth} ${selectedYear}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ArrowUpDown className="h-5 w-5 mr-2 text-primary" />
                  {t('expenses')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatBudgetCurrency(totalBudget)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('spent')}: {formatBudgetCurrency(totalSpent)}
                </p>
                <Progress 
                  value={(totalSpent / totalBudget) * 100} 
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  {t('savings')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {formatBudgetCurrency(budget.savings)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t('remaining')}: {formatBudgetCurrency(remaining > 0 ? remaining : 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('categories')}</h2>
            <div className="space-y-4">
              {budget.categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {formatBudgetCurrency(category.spent)} / {formatBudgetCurrency(category.amount)}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={(category.spent / category.amount) * 100}
                      className={`h-2 ${category.spent > category.amount ? "bg-destructive" : ""}`}
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>
                        {Math.round((category.spent / category.amount) * 100)}%
                      </span>
                      <span>
                        {category.spent > category.amount 
                          ? `${formatBudgetCurrency(category.spent - category.amount)} over` 
                          : `${formatBudgetCurrency(category.amount - category.spent)} left`}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <PieChart className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">{t('empty.title')}</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {t('empty.description')}
          </p>
          <Button onClick={handleCreateBudget}>
            <Plus className="mr-2 h-4 w-4" />
            {t('empty.action')}
          </Button>
        </div>
      )}
    </div>
  );
} 