'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../_components/ExpenseForm';
import { toast } from 'sonner';
import { createExpense } from '@/lib/graphql-client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

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
}

// Separate client component that uses useSearchParams
function ExpenseFormWithParams() {
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<ExpenseFormData> | undefined>(undefined);
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, isLoading } = useUserProfile();
  
  // Get groupId from URL params and set initial form data
  useEffect(() => {
    // Sólo actualizamos el initialData cuando el perfil está cargado o cambia
    if (searchParams) {
      const groupId = searchParams.get('groupId');
      
      // Set initial data with user's currency preference if available
      const formData: Partial<ExpenseFormData> = {
        currency: profile?.currency || 'USD',
      };
      
      if (groupId) {
        formData.isGroupExpense = true;
        formData.groupId = groupId;
      }
      
      console.log('Setting initial form data with currency:', formData.currency);
      setInitialData(formData);
    }
  }, [searchParams, profile]);
  
  // Handle form submission with GraphQL
  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with currency:', data.currency);
      
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
      };
      
      // Call the GraphQL API to create the expense
      await createExpense(expenseInput);
      
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
    router.back();
  };
  
  // Show loading state while currency is being loaded
  if (isLoading) {
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
}

export default function CreateExpensePage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  
  const handleCancel = () => {
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
          <ExpenseFormWithParams />
        </Suspense>
      </div>
    </div>
  );
} 