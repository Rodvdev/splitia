'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Tag,
  DollarSign,
  Edit,
  Trash2,
  Users,
  FileText,
  Share2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { fetchExpense, deleteExpense } from '@/lib/graphql-client';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface ExpenseShare {
  id: string;
  amount: number;
  type: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface ExpenseData {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  location?: string;
  notes?: string;
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
  shares: ExpenseShare[];
  createdAt: string;
  updatedAt: string;
}

// Add this utility function at the top
function isValidDate(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export default function ExpensePage() {
  // Get params directly using useParams hook
  const params = useParams();
  const expenseId = params?.id as string;
  
  const t = useTranslations('expenses');
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch expense data
  useEffect(() => {
    async function loadExpense() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchExpense(expenseId);
        
        // Check if response has the expense data
        if (response && response.expense) {
          // Log the date fields to help diagnose issues
          console.log('Expense data received:', {
            date: response.expense.date,
            createdAt: response.expense.createdAt,
            updatedAt: response.expense.updatedAt
          });
          
          setExpense(response.expense);
        } else {
          setError('Expense not found');
        }
      } catch (err) {
        console.error('Error loading expense:', err);
        setError('Failed to load expense details');
      } finally {
        setLoading(false);
      }
    }
    
    loadExpense();
  }, [expenseId]);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Handle edit button
  const handleEdit = () => {
    router.push(`/dashboard/expenses/${expenseId}/edit`);
  };
  
  // Handle delete button
  const handleDelete = async () => {
    if (!expense) return;
    
    setIsDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success(t('delete.success'));
      router.push('/dashboard/expenses');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error(t('delete.error'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Check if the expense is paid by the current user
  const isPaid = expense?.shares.some(share => 
    share.user.id === expense.paidBy.id && share.amount > 0
  );
  
  // Format date string to readable format
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown date';
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateString));
    } catch (error) {
      console.error('Invalid date format:', dateString, error);
      return 'Invalid date';
    }
  };
  
  // Format time string to readable format
  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return 'Unknown time';
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(dateString));
    } catch (error) {
      console.error('Invalid time format:', dateString, error);
      return 'Invalid time';
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-6 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !expense) {
    return (
      <div className="p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
        <p className="text-muted-foreground mb-4">{error || 'Expense not found'}</p>
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.back')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('details.title')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="mr-2 h-4 w-4" />
            {t('actions.edit')}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('delete.confirmation')}
                  <br />
                  {t('delete.warning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  {t('actions.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? t('delete.deleting') : t('actions.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Main expense card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-card border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{expense.description}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/10">
                  {expense.category?.name || 'Uncategorized'}
                </Badge>
                
                <Badge 
                  variant={isPaid ? "default" : "secondary"}
                  className={isPaid ? "bg-green-100 text-green-800" : ""}
                >
                  {isPaid ? t('status.paid') : t('status.pending')}
                </Badge>
                
                {expense.group && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {t('type.group')}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatCurrency(expense.amount, expense.currency)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {isValidDate(expense.date) ? (
                  <time dateTime={expense.date}>{formatDate(expense.date)}</time>
                ) : (
                  <span>No date available</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Expense details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">
                  {isValidDate(expense.date) ? formatDate(expense.date) : 'No date available'}
                </span>
              </div>
              
              {expense.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">{expense.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Currency:</span>
                <span className="text-sm">{expense.currency}</span>
              </div>
              
              {expense.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm">{expense.category.name}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Paid by:</span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={expense.paidBy.image} alt={expense.paidBy.name} />
                    <AvatarFallback>{expense.paidBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{expense.paidBy.name}</span>
                </div>
              </div>
              
              {expense.group && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Group:</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={expense.group.image} alt={expense.group.name} />
                      <AvatarFallback>{expense.group.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{expense.group.name}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm">
                  {isValidDate(expense.createdAt) ? 
                    `${formatDate(expense.createdAt)} at ${formatTime(expense.createdAt)}` : 
                    'Unknown date'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Updated:</span>
                <span className="text-sm">
                  {isValidDate(expense.updatedAt) ? 
                    `${formatDate(expense.updatedAt)} at ${formatTime(expense.updatedAt)}` : 
                    'Unknown date'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Notes section */}
          {expense.notes && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Notes</h3>
              </div>
              <div className="bg-muted/40 rounded-md p-3 text-sm">
                {expense.notes}
              </div>
            </div>
          )}
          
          {/* Shares section */}
          {expense.shares && expense.shares.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Expense Shares</h3>
              </div>
              <div className="bg-muted/40 rounded-md overflow-hidden">
                <div className="grid grid-cols-3 gap-4 p-3 font-medium text-sm border-b">
                  <div>Person</div>
                  <div>Type</div>
                  <div className="text-right">Amount</div>
                </div>
                <div className="divide-y">
                  {expense.shares.map(share => (
                    <div key={share.id} className="grid grid-cols-3 gap-4 p-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={share.user.image} alt={share.user.name} />
                          <AvatarFallback>{share.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{share.user.name}</span>
                      </div>
                      <div className="capitalize">{share.type.toLowerCase()}</div>
                      <div className="text-right">{formatCurrency(share.amount, expense.currency)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/30 p-4 border-t">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-muted-foreground">
              ID: {expense.id}
            </span>
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('actions.back')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 