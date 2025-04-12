'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Calendar as CalendarIcon, Users, ChevronDown, ChevronRight, MapPin, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Control } from 'react-hook-form';
import { fetchUserGroups, fetchCategories } from '@/lib/graphql-client';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
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
      isPaid: initialData?.isPaid !== undefined ? initialData.isPaid : true,
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
  
  // Get the groupId value from the form
  const groupId = form.watch('groupId');
  
  // Fetch user groups when component mounts or when isGroupExpense becomes true
  React.useEffect(() => {
    if (isGroupExpense) {
      const loadGroups = async () => {
        setIsLoadingGroups(true);
        try {
          // Use the fetchUserGroups helper function
          const response = await fetchUserGroups();
          const fetchedGroups = (response as UserGroupsResponse).userGroups || [];
          setGroups(fetchedGroups);
          
          // When groups are loaded and we have an initialData.groupId, make sure it's selected
          // This is important as the Select needs the options to be loaded first
          if (initialData?.groupId && fetchedGroups.some(group => group.id === initialData.groupId)) {
            form.setValue('groupId', initialData.groupId);
          }
        } catch (error) {
          console.error('Failed to fetch groups:', error);
        } finally {
          setIsLoadingGroups(false);
        }
      };
      
      loadGroups();
    }
  }, [isGroupExpense, initialData, form]);

  // When initialData includes groupId, make sure isGroupExpense is also set to true
  React.useEffect(() => {
    if (initialData?.groupId) {
      // Make sure the group expense toggle is on
      form.setValue('isGroupExpense', true);
      
      // Ensure the groupId is set in the form
      form.setValue('groupId', initialData.groupId);
    }
  }, [initialData, form]);

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
        <div className="grid gap-4 grid-cols-1">
          {/* Essential Fields Section */}
          <div className="space-y-4">
            {/* Amount and Currency in one row */}
            <div className="flex space-x-2">
              <FormField
                control={form.control as FormControlType}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01" 
                        placeholder={t('amount.label')}
                        className="text-xl h-12"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as FormControlType}
                name="currency"
                render={({ field }) => (
                  <FormItem className="w-24">
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          'USD', 'EUR', 'GBP', 'PEN', 'CLP', 'COP', 'ARS', 'MXN',
                          'BOB', 'UYU', 'PYG', 'BRL'
                        ].map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                        <SelectItem value="more">More currencies...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control as FormControlType}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder={t('title.placeholder')} 
                      className="h-12"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Date in one row */}
            <div className="flex space-x-2">
              <FormField
                control={form.control as FormControlType}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex-1">
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
              
              <FormField
                control={form.control as FormControlType}
                name="date"
                render={({ field }) => (
                  <FormItem className="w-40">
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
                              format(field.value, "MMM d, yyyy")
                            ) : (
                              <span>Select date</span>
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
            </div>

            {/* Group Expense Toggle + Selection */}
            {initialData?.isGroupExpense || initialData?.groupId ? (
              <div className="space-y-3">
                <FormField
                  control={form.control as FormControlType}
                  name="groupId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4" />
                        <FormLabel className="font-medium">Group Expense</FormLabel>
                      </div>
                      
                      {isLoadingGroups ? (
                        <div className="flex items-center justify-center p-3 border rounded-md">
                          <span className="text-sm text-muted-foreground">Loading groups...</span>
                        </div>
                      ) : groups.length > 0 ? (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || groupId || ''}
                          value={field.value}
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
                            <SelectItem value="new">+ Create New Group</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button type="button" onClick={() => field.onChange('new')} variant="outline" className="w-full">
                          + Create New Group
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control as FormControlType}
                name="isGroupExpense"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <FormLabel className="font-medium">Split with a group</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Group Selection - Only show when isGroupExpense is true and not pre-selected */}
            {isGroupExpense && !initialData?.groupId && (
              <FormField
                control={form.control as FormControlType}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    {isLoadingGroups ? (
                      <div className="flex items-center justify-center p-3 border rounded-md">
                        <span className="text-sm text-muted-foreground">Loading groups...</span>
                      </div>
                    ) : groups.length > 0 ? (
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || groupId || ''}
                        value={field.value}
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
                          <SelectItem value="new">+ Create New Group</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button type="button" onClick={() => field.onChange('new')} variant="outline" className="w-full">
                        + Create New Group
                      </Button>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Additional Details Section */}
          <Collapsible
            open={showAdditionalFields}
            onOpenChange={setShowAdditionalFields}
            className="border rounded-md p-3"
          >
            <CollapsibleTrigger asChild>
              <div className="flex justify-between items-center cursor-pointer">
                <div className="text-sm font-medium">Additional Details</div>
                {showAdditionalFields ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Location */}
              <FormField
                control={form.control as FormControlType}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2 mb-1">
                      <MapPin className="h-4 w-4" />
                      <FormLabel>Location</FormLabel>
                    </div>
                    <FormControl>
                      <Input 
                        placeholder={t('location.placeholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control as FormControlType}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="h-4 w-4" />
                      <FormLabel>Notes</FormLabel>
                    </div>
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
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4" />
                        <FormLabel className="font-medium">Expense Already Paid</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>
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
            className="px-8"
          >
            {isSubmitting ? t('actions.submitting') : t('actions.submit')}
          </Button>
        </div>
      </form>
    </Form>
  );
} 