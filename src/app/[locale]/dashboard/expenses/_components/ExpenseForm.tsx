'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Control } from 'react-hook-form';
import { fetchUserGroups, fetchCategories } from '@/lib/graphql-client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define form schema
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Title must be at least 3 characters.',
  }),
  amount: z.coerce.number().positive({
    message: 'Amount must be a positive number.',
  }),
  currency: z.string().min(1, {
    message: 'Currency is required.',
  }),
  date: z.date(),
  category: z.string().min(1, {
    message: 'Category is required.',
  }),
  location: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean(),
  isGroupExpense: z.boolean(),
  groupId: z.string().optional(),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define props for the component
interface ExpenseFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Define type for the form control to avoid TypeScript errors
type FormControlType = Control<FormValues>;

// Interface for groups data
interface Group {
  id: string;
  name: string;
  image?: string;
  description?: string;
}

// Interface for category data
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

// Interface for the GraphQL response
interface UserGroupsResponse {
  userGroups: Group[];
}

interface CategoriesResponse {
  categories: Category[];
}

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExpenseFormProps) {
  const t = useTranslations('expenses.form');
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = React.useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
  const { profile } = useUserProfile();
  
  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      amount: initialData?.amount || undefined,
      currency: initialData?.currency || profile?.currency || 'USD',
      date: initialData?.date || new Date(),
      category: initialData?.category || '',
      location: initialData?.location || '',
      notes: initialData?.notes || '',
      isPaid: initialData?.isPaid !== undefined ? initialData.isPaid : false,
      isGroupExpense: initialData?.isGroupExpense !== undefined ? initialData.isGroupExpense : false,
      groupId: initialData?.groupId || '',
    },
  });

  // Update currency when profile loads
  React.useEffect(() => {
    if (profile && !initialData?.currency) {
      form.setValue('currency', profile.currency);
    }
  }, [profile, form, initialData]);

  // Watch the isGroupExpense field to conditionally show group selection
  const isGroupExpense = form.watch('isGroupExpense');
  
  // Fetch user groups when component mounts or when isGroupExpense becomes true
  React.useEffect(() => {
    if (isGroupExpense) {
      const loadGroups = async () => {
        setIsLoadingGroups(true);
        try {
          // Use the fetchUserGroups helper function
          const response = await fetchUserGroups();
          setGroups((response as UserGroupsResponse).userGroups || []);
        } catch (error) {
          console.error('Failed to fetch groups:', error);
        } finally {
          setIsLoadingGroups(false);
        }
      };
      
      loadGroups();
    }
  }, [isGroupExpense]);

  // Fetch categories when component mounts
  React.useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        // Use the fetchCategories helper function
        const response = await fetchCategories();
        setCategories((response as CategoriesResponse).categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data as unknown as FormValues))} className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Title */}
          <FormField
            control={form.control as FormControlType}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('title.label')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('title.placeholder')} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>{t('title.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Amount */}
          <FormField
            control={form.control as FormControlType}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('amount.label')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Currency */}
          <FormField
            control={form.control as FormControlType}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('currency.label')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('currency.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[
                      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 
                      'HKD', 'NZD', 'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 
                      'RUB', 'ZAR', 'BRL', 'TRY', 'PEN', 'CLP', 'COP', 'ARS',
                      'BOB', 'UYU', 'PYG'
                    ].map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Date */}
          <FormField
            control={form.control as FormControlType}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('date.label')}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t('date.placeholder')}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Category */}
          <FormField
            control={form.control as FormControlType}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('category.label')}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('category.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      // Fallback categories if API fails or returns empty
                      ['Food', 'Entertainment', 'Housing', 'Transportation', 'Utilities', 'Healthcare', 'Shopping', 'Personal', 'Other'].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Location */}
          <FormField
            control={form.control as FormControlType}
            name="location"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('location.label')}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t('location.placeholder')} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>{t('location.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Notes */}
          <FormField
            control={form.control as FormControlType}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('notes.label')}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={t('notes.placeholder')} 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Is Paid */}
          <FormField
            control={form.control as FormControlType}
            name="isPaid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t('isPaid.label')}
                  </FormLabel>
                  <FormDescription>
                    {t('isPaid.description')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Is Group Expense */}
          <FormField
            control={form.control as FormControlType}
            name="isGroupExpense"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {t('isGroupExpense.label')}
                  </FormLabel>
                  <FormDescription>
                    {t('isGroupExpense.description')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Group Selection - Only show when isGroupExpense is true */}
          {isGroupExpense && (
            <FormField
              control={form.control as FormControlType}
              name="groupId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Select Group</FormLabel>
                  
                  {isLoadingGroups ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <span className="text-muted-foreground">Loading groups...</span>
                    </div>
                  ) : groups.length > 0 ? (
                    <>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group to split with" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => field.onChange('new')}
                        >
                          + Create New Group
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        You don&apos;t have any groups yet. Create one to split expenses with others.
                      </div>
                      <Button
                        type="button"
                        onClick={() => field.onChange('new')}
                      >
                        Create New Group
                      </Button>
                    </div>
                  )}
                  
                  <FormDescription>
                    Expense will be split equally among all group members
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? t('actions.submitting') : t('actions.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 