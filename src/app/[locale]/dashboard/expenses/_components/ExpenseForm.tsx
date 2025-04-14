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
import { ExpenseBalancePreview } from './ExpenseBalancePreview';

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
  paidById: z.string().optional(),
  isSettlement: z.boolean().optional(),
  settlementStatus: z.enum(['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED']).optional(),
  settlementType: z.enum(['PAYMENT', 'RECEIPT']).optional(),
  settledWithUserId: z.string().optional(),
});

// Define the form values type
type FormValues = z.infer<typeof formSchema>;

// Define props for the component
interface ExpenseFormProps {
  initialData?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
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

// Interface for user data
interface User {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role?: string;
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
  isEditing = false,
}: ExpenseFormProps) {
  const t = useTranslations('expenses.form');
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [groupMembers, setGroupMembers] = React.useState<User[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = React.useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  
  // Prevent rerender issues by using the profile only when needed
  const { profile } = useUserProfile();
  
  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      amount: initialData?.amount || 0,
      currency: initialData?.currency || 'USD',
      date: initialData?.date || new Date(),
      category: initialData?.category || '',
      location: initialData?.location || '',
      notes: initialData?.notes || '',
      isPaid: initialData?.isPaid !== undefined ? initialData.isPaid : true,
      isGroupExpense: initialData?.isGroupExpense !== undefined ? initialData.isGroupExpense : false,
      groupId: initialData?.groupId || '',
      paidById: initialData?.paidById || '',
      isSettlement: initialData?.isSettlement || false,
      settlementStatus: initialData?.settlementStatus || 'PENDING',
      settlementType: initialData?.settlementType || 'PAYMENT',
      settledWithUserId: initialData?.settledWithUserId || '',
    },
  });

  // Apply form values only on mount, not on every render
  const formValuesApplied = React.useRef(false);
  React.useEffect(() => {
    if (!formValuesApplied.current && initialData) {
      formValuesApplied.current = true;
    }
  }, [initialData, form]);

  // Watch the isGroupExpense field to conditionally show group selection
  const isGroupExpense = form.watch('isGroupExpense');
  
  // Get the groupId value from the form
  const groupId = form.watch('groupId');
  
  // Watch the groupId field to load group members when it changes
  const selectedGroupId = form.watch('groupId');
  
  // Watch the fields for settlement functionality
  const isSettlement = form.watch('isSettlement');
  const settlementType = form.watch('settlementType');
  
  // Watch amount and currency for the preview
  const amount = form.watch('amount');
  const currency = form.watch('currency');
  const selectedPaidById = form.watch('paidById');
  
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

  // Fetch group members when the selected group changes
  React.useEffect(() => {
    if (isGroupExpense && selectedGroupId && selectedGroupId !== 'new') {
      const fetchGroupMembers = async () => {
        setIsLoadingMembers(true);
        try {
          // Query to fetch group members
          const response = await fetch('/api/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query GroupMembers($groupId: ID!) {
                  group(id: $groupId) {
                    members {
                      id
                      name
                      email
                      image
                      role
                    }
                  }
                }
              `,
              variables: {
                groupId: selectedGroupId,
              },
            }),
          });

          const result = await response.json();
          
          if (result.errors) {
            console.error('Error fetching group members:', result.errors);
            return;
          }
          
          if (result.data?.group?.members) {
            // Filter out members with role "assistant"
            const filteredMembers = result.data.group.members.filter(
              (member: User) => member.role !== 'assistant'
            );
            
            setGroupMembers(filteredMembers);
            
            // If current paidById is not in the filtered group members, reset it to the current user
            const currentPaidById = form.getValues('paidById');
            const memberIds = filteredMembers.map((member: User) => member.id);
            
            if (currentPaidById && !memberIds.includes(currentPaidById)) {
              form.setValue('paidById', profile?.id || '');
            }
          }
        } catch (error) {
          console.error('Failed to fetch group members:', error);
        } finally {
          setIsLoadingMembers(false);
        }
      };
      
      fetchGroupMembers();
    } else if (!isGroupExpense || selectedGroupId === 'new') {
      // Reset to only the current user if not a group expense
      setGroupMembers([]);
      if (profile) {
        form.setValue('paidById', profile.id);
      }
    }
  }, [selectedGroupId, isGroupExpense, form, profile]);
  
  // Handle settlement option changes
  React.useEffect(() => {
    if (isSettlement) {
      // Auto open additional details when it's a settlement
      setShowAdditionalFields(true);
      
      // Reset settlement status when changing type
      form.setValue('settlementStatus', 'PENDING');
    }
  }, [isSettlement, settlementType, form]);

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
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
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
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={t('category.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
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

            {/* Paid By - Who made this expense */}
            <FormField
              control={form.control as FormControlType}
              name="paidById"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4" />
                    <FormLabel className="font-medium">Who paid?</FormLabel>
                  </div>
                  
                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center p-3 border rounded-md">
                      <span className="text-sm text-muted-foreground">Loading members...</span>
                    </div>
                  ) : isGroupExpense && selectedGroupId && selectedGroupId !== 'new' && groupMembers.length > 0 ? (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select who paid" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {groupMembers.map((member) => (
                          <SelectItem 
                            key={member.id} 
                            value={member.id}
                            className="flex items-center"
                          >
                            <div className="flex items-center gap-2">
                              {member.name || member.email}
                              {member.id === profile?.id && (
                                <span className="text-xs text-muted-foreground ml-1">(you)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      type="text"
                      value={profile?.name ?? 'You'}
                      onChange={() => {}}
                      disabled
                      className="bg-muted"
                    />
                  )}
                  {isGroupExpense && groupMembers.length === 0 && !isLoadingMembers && (
                    <div className="text-xs text-muted-foreground mt-1">
                      No available members found. Assistants are excluded from payment options.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a group to split with" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white">
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
                  <FormItem className="p-5 border rounded-md hover:bg-accent/40 transition-colors relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <FormLabel className="font-medium text-base cursor-pointer">Split with a group</FormLabel>
                          <p className="text-sm text-muted-foreground mt-1">
                            Divide the expense equally among group members
                          </p>
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input h-6 w-11"
                        />
                      </FormControl>
                    </div>
                    {field.value && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                        Active
                      </div>
                    )}
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
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a group to split with" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white">
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

            {/* Show balance preview when it's a group expense and we have all required data */}
            {isGroupExpense && selectedGroupId && selectedGroupId !== 'new' && amount && currency && groupMembers.length > 0 && (
              <ExpenseBalancePreview
                amount={amount}
                currency={currency}
                groupMembers={groupMembers}
                paidById={selectedPaidById}
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
              {/* Is Settlement - for settlement transactions between users */}
              {isGroupExpense && (
                <FormField
                  control={form.control as FormControlType}
                  name="isSettlement"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <FormLabel className="font-medium">This is a settlement between users</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      {field.value && (
                        <div className="mt-3 pl-6 border-l-2 border-muted-foreground/20 space-y-3">
                          {/* Settlement Type */}
                          <FormField
                            control={form.control as FormControlType}
                            name="settlementType"
                            render={({ field: typeField }) => (
                              <FormItem>
                                <div className="flex items-center space-x-2 mb-2">
                                  <FormLabel className="font-medium">Settlement Type</FormLabel>
                                </div>
                                <Select
                                  onValueChange={typeField.onChange}
                                  defaultValue={typeField.value}
                                  value={typeField.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="Select settlement type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="PAYMENT">I&apos;m paying someone</SelectItem>
                                    <SelectItem value="RECEIPT">I&apos;m being paid</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Settled With User */}
                          <FormField
                            control={form.control as FormControlType}
                            name="settledWithUserId"
                            render={({ field: userField }) => (
                              <FormItem>
                                <div className="flex items-center space-x-2 mb-2">
                                  <FormLabel className="font-medium">
                                    {form.watch('settlementType') === 'PAYMENT' 
                                      ? 'Paying To' 
                                      : 'Receiving From'}
                                  </FormLabel>
                                </div>
                                <Select
                                  onValueChange={userField.onChange}
                                  defaultValue={userField.value}
                                  value={userField.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white">
                                    {groupMembers
                                      .filter(member => member.id !== profile?.id)
                                      .map((member) => (
                                        <SelectItem 
                                          key={member.id} 
                                          value={member.id}
                                          className="flex items-center"
                                        >
                                          <div className="flex items-center gap-2">
                                            {member.name || member.email}
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Settlement Status */}
                          <FormField
                            control={form.control as FormControlType}
                            name="settlementStatus"
                            render={({ field: statusField }) => (
                              <FormItem>
                                <div className="flex items-center space-x-2 mb-2">
                                  <FormLabel className="font-medium">Status</FormLabel>
                                </div>
                                <Select
                                  onValueChange={statusField.onChange}
                                  defaultValue={statusField.value}
                                  value={statusField.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-white">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PENDING_CONFIRMATION">
                                      {form.watch('settlementType') === 'PAYMENT' 
                                        ? 'Marked as Paid (Waiting Confirmation)' 
                                        : 'Marked as Received (Waiting Confirmation)'}
                                    </SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {form.watch('settlementStatus') === 'PENDING' && 'Transaction not settled yet'}
                                  {form.watch('settlementStatus') === 'PENDING_CONFIRMATION' && 'Waiting for other user to confirm'}
                                  {form.watch('settlementStatus') === 'CONFIRMED' && 'Transaction fully confirmed by both parties'}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              )}

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
                        <div>
                          <FormLabel className="font-medium">Initial expense already paid</FormLabel>
                          <div className="text-xs text-muted-foreground">
                            {!isSettlement ? 
                              "This indicates whether the expense was paid at time of purchase" : 
                              "Note: This only applies to the original expense, not the settlement between users"
                            }
                          </div>
                        </div>
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
            {isSubmitting 
              ? t('actions.submitting') 
              : isEditing 
                ? t('actions.update') 
                : t('actions.submit')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 