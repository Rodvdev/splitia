'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../_components/ExpenseForm';
import { toast } from 'sonner';
import { createExpense } from '@/lib/graphql-client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import React from 'react';

// Define the expense form data type
interface ExpenseFormData {
  title: string;
  amount: number;
  currency: string;
  date: Date;
  category: string; // Now this will be the category ID, not the name
  location?: string;
  notes?: string;
  isPaid: boolean;
  isGroupExpense: boolean;
  groupId?: string;
  paidById?: string;
}

// Separate client component that uses useSearchParams - Wrapped in a memo to prevent re-renders
const ExpenseFormContainer = React.memo(function ExpenseFormContainerMemo() {
  const searchParams = useSearchParams();
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, isLoading } = useUserProfile();
  const initializedRef = useRef(false);
  const [initialData, setInitialData] = useState<Partial<ExpenseFormData> | null>(() => {
    // Try to retrieve form data from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expense_form_data');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.date) {
            parsed.date = new Date(parsed.date);
          }
          return parsed;
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
    }
    return null;
  });

  // Initialize form data only once
  useEffect(() => {
    if (!initializedRef.current && profile && !initialData) {
      initializedRef.current = true;
      
      const groupId = searchParams?.get('groupId');
      const formData = {
        currency: profile.currency || 'USD',
        paidById: profile.id,
        isGroupExpense: !!groupId,
        groupId: groupId || undefined,
        date: new Date()
      };
      
      // Save to localStorage to persist across tab changes
      localStorage.setItem('expense_form_data', JSON.stringify(formData));
      setInitialData(formData);
    }
  }, [profile, searchParams, initialData]);
  
  // Handle form submission with GraphQL
  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    
    try {
      // Map form data to GraphQL input format
      const expenseInput = {
        amount: data.amount,
        description: data.title, // Map title to description
        date: data.date,
        // Only include categoryId if it's a valid ID (not a string like "Food" from fallback)
        ...(data.category && data.category.length > 8 && { categoryId: data.category }),
        currency: data.currency,
        location: data.location || undefined,
        notes: data.notes || undefined,
        // If it's a group expense and a group is selected, include the groupId
        groupId: data.isGroupExpense && data.groupId && data.groupId !== 'new' 
          ? data.groupId 
          : undefined,
        paidById: data.paidById
      };
      
      // Call the GraphQL API to create the expense
      await createExpense(expenseInput);
      
      // Clear saved form data after successful submission
      localStorage.removeItem('expense_form_data');
      
      // Show success message
      toast.success(t('notifications.createSuccess'));
      
      // Redirect back to expenses list or the group page if creating from there
      if (data.isGroupExpense && data.groupId && data.groupId !== 'new') {
        // Check if we need to call the onExpenseCreated callback
        const storedGroupId = localStorage.getItem('onExpenseCreatedCallback');
        if (storedGroupId === data.groupId) {
          localStorage.removeItem('onExpenseCreatedCallback');
        }
        router.push(`/dashboard/groups/${data.groupId}`);
      } else {
        router.push('/dashboard/expenses');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(t('notifications.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    // Clear saved form data when cancelling
    localStorage.removeItem('expense_form_data');
    router.back();
  };
  
  // Show loading state while currency is being loaded
  if (isLoading || !initialData) {
    return <div className="p-6 flex justify-center">Loading...</div>;
  }
  
  return (
    <ExpenseForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
});

// Use a stable key to prevent re-mounting of the form container
export default function CreateExpensePage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  
  const handleCancel = () => {
    localStorage.removeItem('expense_form_data');
    router.back();
  };
  
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
        <h1 className="text-2xl font-bold">{t('create.title')}</h1>
      </div>
      
      <div className="bg-card border rounded-lg p-6">
        <Suspense fallback={<div>Loading...</div>}>
          {/* Key is stable, preventing remounts */}
          <ExpenseFormContainer />
        </Suspense>
      </div>
    </div>
  );
} 