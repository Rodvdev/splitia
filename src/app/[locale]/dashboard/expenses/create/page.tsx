'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../_components/ExpenseForm';
import { toast } from 'sonner';
import { createExpense } from '@/lib/graphql-client';

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

export default function CreateExpensePage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      };
      
      // Call the GraphQL API to create the expense
      await createExpense(expenseInput);
      
      // Show success message
      toast.success(t('notifications.createSuccess'));
      
      // Redirect back to expenses list
      router.push('/dashboard/expenses');
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error(t('notifications.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    router.push('/dashboard/expenses');
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
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 