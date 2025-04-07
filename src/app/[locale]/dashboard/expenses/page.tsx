'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Search,
  Filter,
  Plus,
  ArrowUpDown,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Custom components
import { ExpenseCard } from './_components/ExpenseCard';

// GraphQL client
import { fetchExpenses, fetchCategories } from '@/lib/graphql-client';

// Types
interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string; // ISO string format
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

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const router = useRouter();
  
  // State for data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [filterPaid, setFilterPaid] = useState('all');
  
  // Load expenses and categories on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch expenses
        const expensesData = await fetchExpenses({
          limit: 50, // Fetch more than needed for client-side filtering
        }) as { expenses: Expense[] };
        
        // Fetch categories
        const categoriesData = await fetchCategories() as { categories: Category[] };
        
        setExpenses(expensesData.expenses);
        setCategories(categoriesData.categories);
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        
        // Type guard for GraphQL errors
        type GraphQLError = {
          message?: string;
          response?: {
            errors?: Array<{
              extensions?: {
                code?: string;
              };
            }>;
          };
        };
        
        const graphqlError = err as GraphQLError;
        
        // Check for authentication errors
        if (graphqlError.message?.includes('Not authenticated') || 
            graphqlError.response?.errors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
          setError(t('error.authError') || 'Authentication error. Please log in again.');
          
          // Optional: Redirect to login
          // router.push('/sign-in');
        } else {
          setError(t('error.loadError') || 'Failed to load expenses. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Handle expense selection
  const handleExpenseClick = (id: string) => {
    router.push(`/dashboard/expenses/${id}`);
  };
  
  // Handle new expense creation
  const handleCreateExpense = () => {
    router.push('/dashboard/expenses/create');
  };
  
  // Filter expenses based on criteria
  const filteredExpenses = expenses.filter(expense => {
    // Filter by search query (match description or location)
    if (
      searchQuery && 
      !expense.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(expense.location && expense.location.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    
    // Filter by category
    if (selectedCategory !== 'all' && expense.category?.id !== selectedCategory) {
      return false;
    }
    
    // Filter by payment status - checking if it was paid by the current user
    // This is a simplified check - in a real app, you would have a more robust logic
    if (filterPaid === 'paid' && !expense.shares.some(share => 
      share.user.id === expense.paidBy.id && share.amount > 0)
    ) {
      return false;
    }
    
    if (filterPaid === 'pending' && expense.shares.some(share => 
      share.user.id === expense.paidBy.id && share.amount > 0)
    ) {
      return false;
    }
    
    return true;
  });
  
  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'amount') {
      return b.amount - a.amount;
    }
    return 0;
  });
  
  // Format expense data for the ExpenseCard component
  const formatExpenseForCard = (expense: Expense) => {
    return {
      id: expense.id,
      title: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: new Date(expense.date),
      category: expense.category?.name || 'Uncategorized',
      location: expense.location,
      participants: expense.shares.length,
      isPaid: expense.shares.some(share => 
        share.user.id === expense.paidBy.id && share.amount > 0
      ),
      isGroupExpense: Boolean(expense.group),
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={handleCreateExpense}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.create')}
        </Button>
      </div>
      
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filters.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterPaid('all')}>
                  {t('filters.status.all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPaid('paid')}>
                  {t('filters.status.paid')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPaid('pending')}>
                  {t('filters.status.pending')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  {t('filters.sort.date')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('amount')}>
                  {t('filters.sort.amount')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Expenses List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            // Loading skeletons...
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-card border rounded-lg p-4 h-48 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-4/5 mb-4"></div>
                <div className="flex justify-between items-center mt-6">
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : sortedExpenses.length > 0 ? (
            sortedExpenses.map(expense => (
              <ExpenseCard 
                key={expense.id} 
                expense={formatExpenseForCard(expense)}
                onClick={handleExpenseClick}
              />
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center bg-muted/40 rounded-lg">
              <div className="mb-4 p-3 bg-destructive/10 rounded-full">
                <Search className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-medium mb-1">{error}</h3>
              <p className="text-muted-foreground mb-4">{t('error.tryAgain')}</p>
              <Button onClick={() => window.location.reload()}>
                {t('actions.refresh')}
              </Button>
            </div>
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center bg-muted/40 rounded-lg">
              <div className="mb-4 p-3 bg-primary/10 rounded-full">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('empty.title')}</h3>
              <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
              <Button onClick={() => router.push('/dashboard/expenses/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('empty.action')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 