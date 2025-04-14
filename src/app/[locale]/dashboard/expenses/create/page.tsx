'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../_components/ExpenseForm';
import { toast } from 'sonner';
import { createExpense } from '@/lib/graphql-client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

// Store para mantener el estado de la página entre navegaciones
const createGlobalState = () => {
  let data: Partial<ExpenseFormData> | null = null;
  const listeners = new Set<(data: Partial<ExpenseFormData> | null) => void>();

  return {
    getState: () => data,
    setState: (newData: Partial<ExpenseFormData> | null) => {
      data = newData;
      listeners.forEach((listener) => listener(data));
    },
    subscribe: (listener: (data: Partial<ExpenseFormData> | null) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

// Crear una instancia global que sobrevive a la navegación
const globalFormState = createGlobalState();

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
}

// Memorizar el componente para evitar re-renders
const ExpenseFormContainer = React.memo(function ExpenseFormContainer() {
  const searchParams = useSearchParams();
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, isLoading } = useUserProfile();
  const [initialData, setInitialData] = useState(() => globalFormState.getState());
  const initializedRef = useRef(false);

  // Solo actualizar los datos iniciales si no existen
  useEffect(() => {
    if (!initializedRef.current && profile && !initialData) {
      initializedRef.current = true;
      const groupId = searchParams?.get('groupId');
      
      // Crear datos iniciales solo una vez
      const formData = {
        currency: profile.currency || 'USD',
        paidById: profile.id,
        isGroupExpense: !!groupId,
        groupId: groupId || undefined,
        date: new Date()
      };
      
      // Guardar en el estado global para persistencia entre navegaciones
      globalFormState.setState(formData);
      setInitialData(formData);
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('expense_form_data', JSON.stringify({
        ...formData,
        date: formData.date.toISOString()
      }));
    } else if (!initialData && !isLoading) {
      // Intentar recuperar de localStorage si no hay datos en el estado global
      const savedData = localStorage.getItem('expense_form_data');
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          if (parsedData.date) {
            parsedData.date = new Date(parsedData.date);
          }
          globalFormState.setState(parsedData);
          setInitialData(parsedData);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
    }
  }, [profile, searchParams, initialData, isLoading]);
  
  // Handle form submission with GraphQL
  const handleSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);
    
    try {
      // Map form data to GraphQL input format
      const expenseInput = {
        amount: data.amount,
        description: data.title,
        date: data.date,
        ...(data.category && data.category.length > 8 && { categoryId: data.category }),
        currency: data.currency,
        location: data.location || undefined,
        notes: data.notes || undefined,
        groupId: data.isGroupExpense && data.groupId && data.groupId !== 'new' 
          ? data.groupId 
          : undefined,
        paidById: data.paidById
      };
      
      // Call the GraphQL API to create the expense
      await createExpense(expenseInput);
      
      // Limpiar el estado global y localStorage después de enviar
      globalFormState.setState(null);
      localStorage.removeItem('expense_form_data');
      
      // Show success message
      toast.success(t('notifications.createSuccess'));
      
      // Redirect based on groupId
      if (data.isGroupExpense && data.groupId && data.groupId !== 'new') {
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
    // Limpiar el estado global y localStorage al cancelar
    globalFormState.setState(null);
    localStorage.removeItem('expense_form_data');
    router.back();
  };
  
  // Mostrar el loader solo durante la carga inicial
  if (!initialData && isLoading) {
    return <div className="p-6 flex justify-center">Loading...</div>;
  }
  
  return (
    <ExpenseForm
      key="expense-form" // Usar una key estable
      initialData={initialData || {}}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  );
});

export default function CreateExpensePage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  
  const handleCancel = () => {
    globalFormState.setState(null);
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
          <ExpenseFormContainer />
        </Suspense>
      </div>
    </div>
  );
} 