'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Plus, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseCard } from '@/app/[locale]/dashboard/expenses/_components/ExpenseCard';
import { fetchExpenses } from '@/lib/graphql-client';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  location?: string;
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
    icon?: string;
    color?: string;
  };
  shares: Array<{
    id: string;
    amount: number;
    type: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

interface GroupExpensesProps {
  groupId: string;
  onExpenseCreated?: () => void;
}

// Definir la interfaz para la respuesta de fetchExpenses
interface ExpensesResponse {
  expenses: Expense[];
}

export function GroupExpenses({ groupId, onExpenseCreated }: GroupExpensesProps) {
  const t = useTranslations('groups');
  const tExpenses = useTranslations('expenses');
  const router = useRouter();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch expenses for this group
  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchExpenses({ groupId }) as ExpensesResponse;
      if (response && response.expenses) {
        setExpenses(response.expenses);
      }
    } catch (error) {
      console.error('Error loading group expenses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadExpenses();
  }, [groupId, loadExpenses]);
  
  // Handle clicking on an expense to view details
  const handleExpenseClick = (expenseId: string) => {
    router.push(`/dashboard/expenses/${expenseId}`);
  };
  
  // Handle adding a new expense for this group
  const handleAddExpense = () => {
    // Store the callback in localStorage so it can be called after expense creation
    if (onExpenseCreated) {
      localStorage.setItem('onExpenseCreatedCallback', groupId);
    }
    router.push(`/dashboard/expenses/create?groupId=${groupId}`);
  };

  // Check if we need to call onExpenseCreated when component mounts
  useEffect(() => {
    const storedGroupId = localStorage.getItem('onExpenseCreatedCallback');
    if (storedGroupId === groupId) {
      localStorage.removeItem('onExpenseCreatedCallback');
      loadExpenses();
      onExpenseCreated?.();
    }
  }, [groupId, onExpenseCreated, loadExpenses]);
  
  // Format expense data for the ExpenseCard component
  const formatExpenseForCard = (expense: Expense) => {
    return {
      id: expense.id,
      title: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: new Date(expense.date),
      category: expense.category?.name || 'Sin categoría',
      location: expense.location,
      participants: expense.shares.length,
      isPaid: expense.shares.some(share => 
        share.user.id === expense.paidBy.id && share.amount > 0
      ),
      isGroupExpense: true,
    };
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {t('expenses')}
        </CardTitle>
        <Button onClick={handleAddExpense} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {tExpenses('add')}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t('expensesDescription')}
        </p>
        
        {isLoading ? (
          // Loading state
          <div className="space-y-3">
            <div className="h-24 rounded-md bg-muted animate-pulse" />
            <div className="h-24 rounded-md bg-muted animate-pulse" />
          </div>
        ) : expenses.length > 0 ? (
          // Show expenses
          <div className="space-y-3">
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={formatExpenseForCard(expense)}
                onClick={handleExpenseClick}
              />
            ))}
          </div>
        ) : (
          // No expenses
          <div className="py-6 text-center">
            <p className="text-muted-foreground">{t('noExpenses')}</p>
            <Button 
              onClick={handleAddExpense} 
              variant="outline" 
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              {tExpenses('add')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 