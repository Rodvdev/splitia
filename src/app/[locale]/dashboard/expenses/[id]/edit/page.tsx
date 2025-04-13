'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../../_components/ExpenseForm';
import { toast } from 'sonner';
import { fetchExpense, updateExpense } from '@/lib/graphql-client';

// Define the expense form data type
interface ExpenseFormData {
  title: string;
  amount: number;
  currency: string;
  date: Date;
  category: string;
  location?: string;
  notes?: string;
  isPaid: boolean;
  isGroupExpense: boolean;
  groupId?: string;
  paidById?: string;
  isSettlement?: boolean;
  settlementStatus?: 'PENDING' | 'PENDING_CONFIRMATION' | 'CONFIRMED';
  settlementType?: 'PAYMENT' | 'RECEIPT';
  settledWithUserId?: string;
}

export default function EditExpensePage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<ExpenseFormData> | undefined>(undefined);
  
  // Fetch expense data when component mounts
  useEffect(() => {
    async function loadExpense() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchExpense(expenseId);
        
        if (response?.expense) {
          const expense = response.expense; // Use a local variable to avoid nullable issues
          // Transform expense data to form data format
          setInitialData({
            title: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            date: new Date(expense.date),
            category: expense.category?.id || '',
            location: expense.location,
            notes: expense.notes,
            isPaid: Boolean(expense.shares?.find(share => 
              share.user?.id === expense.paidBy?.id && share.amount > 0
            )),
            isGroupExpense: Boolean(expense.group),
            groupId: expense.group?.id,
            paidById: expense.paidBy?.id,
            // Settlement data if available
            isSettlement: Boolean(expense.isSettlement),
            // If we have settlement data, include it
            ...(expense.settlement && {
              settlementStatus: expense.settlement.settlementStatus,
              settlementType: expense.settlement.settlementType,
              settledWithUserId: expense.settlement.settledWithUserId
            })
          });
        } else {
          setError('Expense not found');
        }
      } catch (err) {
        console.error('Error loading expense:', err);
        setError('Failed to load expense data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadExpense();
  }, [expenseId]);
  
  // Handle form submission with GraphQL
  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    
    try {
      // Map form data to GraphQL input format
      const expenseInput = {
        id: expenseId,
        amount: data.amount,
        description: data.title,
        date: data.date,
        // Only include categoryId if it's a valid ID
        ...(data.category && data.category.length > 8 && { categoryId: data.category }),
        currency: data.currency,
        location: data.location || undefined,
        notes: data.notes || undefined,
        // If it's a group expense and a group is selected, include the groupId
        groupId: data.isGroupExpense && data.groupId && data.groupId !== 'new' 
          ? data.groupId 
          : undefined,
        // Include settlement data if it's a settlement
        ...(data.isSettlement && {
          isSettlement: true,
          settlementStatus: data.settlementStatus,
          settlementType: data.settlementType,
          settledWithUserId: data.settledWithUserId
        })
      };
      
      // Call the GraphQL API to update the expense
      await updateExpense(expenseInput);
      
      // Show success message
      toast.success(t('notifications.updateSuccess'));
      
      // Redirect back
      router.back();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error(t('notifications.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('edit.title')}</h1>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('edit.title')}</h1>
        </div>
        
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="text-destructive font-medium mb-2">{error}</div>
          <Button onClick={handleCancel} variant="outline">
            {t('actions.back')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('edit.title')}</h1>
      </div>
      
      <div className="bg-card border rounded-lg p-6">
        <ExpenseForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing={true}
        />
      </div>
    </div>
  );
} 