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
import { useUserPreferences } from '@/components/user/user-preferences-provider';

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
  customShares?: Record<string, number>;
}

// Define the expense input type para coincidir con graphql-client
interface ExpenseInput {
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  currency: string;
  location?: string;
  notes?: string;
  groupId?: string;
  paidById?: string;
  shares?: Array<{
    userId: string;
    amount: number;
    type: 'EQUAL' | 'PERCENTAGE' | 'FIXED';
  }>;
}

// Memorizar el componente para evitar re-renders
const ExpenseFormContainer = React.memo(function ExpenseFormContainer() {
  const searchParams = useSearchParams();
  const t = useTranslations('expenses');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { preferences, isLoading: isPreferencesLoading } = useUserPreferences();
  const [initialData, setInitialData] = useState(() => globalFormState.getState());
  const initializedRef = useRef(false);

  // Solo actualizar los datos iniciales si no existen
  useEffect(() => {
    console.log('useEffect triggered: initializedRef.current =', initializedRef.current, 'initialData =', initialData);
    if (!initializedRef.current && !initialData) {
      initializedRef.current = true;
      
      const groupId = searchParams?.get('groupId');
      
      // Asegurar que usamos la moneda del perfil como prioridad
      const userCurrency = profile?.currency || preferences.currency || 'USD';
      
      const formData = {
        currency: userCurrency,
        paidById: profile?.id || '',
        isGroupExpense: !!groupId,
        groupId: groupId || undefined,
        date: new Date()
      };
      
      console.log('Inicializando formulario con moneda:', userCurrency);
      
      // Guardar en el estado global para persistencia entre navegaciones
      globalFormState.setState(formData);
      setInitialData(formData);
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('expense_form_data', JSON.stringify({
        ...formData,
        date: formData.date.toISOString()
      }));
      console.log('Form initialized with data:', formData);
    } else if (!initialData && !isProfileLoading && !isPreferencesLoading) {
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
          console.log('Retrieved form data from localStorage:', parsedData);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      } else {
        // Si no hay datos guardados, al menos inicializar con la moneda preferida
        const userCurrency = profile?.currency || preferences.currency || 'USD';
        
        const formData = {
          currency: userCurrency,
          paidById: profile?.id || '',
          date: new Date()
        };
        
        console.log('Inicializando formulario sin localStorage con moneda:', userCurrency);
        
        globalFormState.setState(formData);
        setInitialData(formData);
      }
    }
  }, [profile, searchParams, initialData, preferences, isProfileLoading, isPreferencesLoading]);
  
  // Handle form submission with GraphQL
  const handleSubmit = async (data: ExpenseFormData & { customShares?: Record<string, number> }) => {
    setIsSubmitting(true);
    
    try {
      // Map form data to GraphQL input format
      const expenseInput: ExpenseInput = {
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
      
      // Si hay customShares en los datos del formulario, las agregamos al input
      if (data.customShares && Object.keys(data.customShares).length > 0) {
        // Filtrar solo los miembros seleccionados
        const selectedCustomShares = Object.entries(data.customShares)
          .filter(([, amount]) => amount > 0)
          .map(([userId, amount]) => ({
            userId,
            amount: Number(amount),
            type: 'FIXED' as const
          }));
        
        // Solo agregar shares si hay valores válidos
        if (selectedCustomShares.length > 0) {
          expenseInput.shares = selectedCustomShares;
          
          // Verificar que la suma de los shares sea igual al monto total
          const sharesSum = selectedCustomShares.reduce((sum, share) => sum + share.amount, 0);
          const roundedSharesSum = parseFloat(sharesSum.toFixed(2));
          const roundedAmount = parseFloat(data.amount.toFixed(2));
          
          // Si hay una pequeña discrepancia de redondeo, ajustar el primer share
          if (roundedSharesSum !== roundedAmount && selectedCustomShares.length > 0) {
            const diff = roundedAmount - roundedSharesSum;
            selectedCustomShares[0].amount = parseFloat((selectedCustomShares[0].amount + diff).toFixed(2));
          }
        }
      }
      
      console.log('Sending expense input:', expenseInput);
      
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
    console.log('Cancelling form, clearing global state and localStorage');
    // Limpiar el estado global y localStorage al cancelar
    globalFormState.setState(null);
    localStorage.removeItem('expense_form_data');
    router.back();
  };
  
  // Mostrar el loader solo durante la carga inicial
  if (!initialData && (isProfileLoading || isPreferencesLoading)) {
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