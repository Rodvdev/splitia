'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, CreditCard, DollarSign, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { toast } from 'sonner';

import { fetchGroup, fetchGroupBalances, fetchGroupBalancesMultiCurrency, createSettlement } from '@/lib/graphql-client';

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: string;
}

interface GroupBalance {
  userId: string;
  name: string;
  email?: string;
  image?: string;
  amount: number;
  currency: string;
}

interface BalancePerCurrency {
  currency: string;
  amount: number;
}

interface MultiCurrencyBalance {
  userId: string;
  name: string;
  email?: string;
  image?: string;
  balances: BalancePerCurrency[];
}

interface CurrencyBalanceSummary {
  currency: string;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  members: GroupMember[];
}

interface BalanceSummary {
  totalOwed: number; 
  totalOwing: number;
  netBalance: number;
  currency: string;
  balances: GroupBalance[];
}

interface MultiCurrencyBalanceSummary {
  balancesByCurrency: CurrencyBalanceSummary[];
  balances: MultiCurrencyBalance[];
}

export default function SettleUpPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  const t = useTranslations('settlements');
  const tGroups = useTranslations('groups');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [multiCurrencyData, setMultiCurrencyData] = useState<MultiCurrencyBalanceSummary | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [settlementType, setSettlementType] = useState<'PAYMENT' | 'RECEIPT'>('PAYMENT');
  const [hasMultipleCurrencies, setHasMultipleCurrencies] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  
  // Load group and balances data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch group details
        const groupResponse = await fetchGroup(groupId);
        if (groupResponse?.group) {
          setGroup(groupResponse.group);
        }
        
        // Fetch user's preferred currency
        let preferredCurrency = 'PEN';
        try {
          const userResponse = await fetch('/api/user/preferences');
          const userData = await userResponse.json();
          if (userData.currency) {
            preferredCurrency = userData.currency;
          }
        } catch (prefError) {
          console.error('Error obteniendo preferencias del usuario:', prefError);
        }
        
        // Try to fetch multi-currency balances first
        try {
          interface GroupBalancesMultiCurrencyResponse {
            groupBalancesMultiCurrency: MultiCurrencyBalanceSummary;
          }
          
          const multiCurrencyResponse = await fetchGroupBalancesMultiCurrency(groupId) as GroupBalancesMultiCurrencyResponse;
          
          if (multiCurrencyResponse?.groupBalancesMultiCurrency) {
            const { balancesByCurrency, balances } = multiCurrencyResponse.groupBalancesMultiCurrency;
            
            setMultiCurrencyData(multiCurrencyResponse.groupBalancesMultiCurrency);
            
            // Check if there are multiple currencies
            const currencies = balancesByCurrency.map(b => b.currency);
            setAvailableCurrencies(currencies);
            setHasMultipleCurrencies(currencies.length > 1);
            
            // Set default selected currency (preferred currency if available, otherwise first one)
            let defaultCurrency;
            if (currencies.includes(preferredCurrency)) {
              defaultCurrency = preferredCurrency;
            } else if (currencies.length > 0) {
              defaultCurrency = currencies[0];
            } else {
              defaultCurrency = preferredCurrency;
            }
            setSelectedCurrency(defaultCurrency);
            
            // Convert multi-currency data to single currency format for the selected currency
            const singleCurrencyBalances = convertToSingleCurrencyBalances(balances, defaultCurrency);
            const currencySummary = balancesByCurrency.find(b => b.currency === defaultCurrency);
            
            setBalances({
              totalOwed: currencySummary?.totalOwed || 0,
              totalOwing: currencySummary?.totalOwing || 0,
              netBalance: currencySummary?.netBalance || 0,
              currency: defaultCurrency,
              balances: singleCurrencyBalances
            });
          }
        } catch (multiCurrencyError) {
          console.error('Error fetching multi-currency balances:', multiCurrencyError);
          
          // Fallback to single currency balances
          interface GroupBalancesResponse {
            groupBalances: BalanceSummary;
          }
          
          const balancesResponse = await fetchGroupBalances(groupId) as GroupBalancesResponse;
          if (balancesResponse?.groupBalances) {
            setBalances(balancesResponse.groupBalances);
            setSelectedCurrency(balancesResponse.groupBalances.currency);
            setAvailableCurrencies([balancesResponse.groupBalances.currency]);
            setHasMultipleCurrencies(false);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error(t('errors.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [groupId, t]);
  
  // Helper function to convert multi-currency balances to single currency
  const convertToSingleCurrencyBalances = (multiBalances: MultiCurrencyBalance[], currency: string): GroupBalance[] => {
    const result: GroupBalance[] = [];
    
    for (const balance of multiBalances) {
      const currencyBalance = balance.balances.find(b => b.currency === currency);
      if (currencyBalance && currencyBalance.amount !== 0) {
        result.push({
          userId: balance.userId,
          name: balance.name,
          email: balance.email,
          image: balance.image,
          amount: currencyBalance.amount,
          currency: currency
        });
      }
    }
    
    return result;
  };
  
  // Handle currency change
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    
    if (multiCurrencyData) {
      // Update balances for the new currency
      const singleCurrencyBalances = convertToSingleCurrencyBalances(multiCurrencyData.balances, currency);
      const currencySummary = multiCurrencyData.balancesByCurrency.find(b => b.currency === currency);
      
      setBalances({
        totalOwed: currencySummary?.totalOwed || 0,
        totalOwing: currencySummary?.totalOwing || 0,
        netBalance: currencySummary?.netBalance || 0,
        currency: currency,
        balances: singleCurrencyBalances
      });
      
      // Reset user and amount selections
      setSelectedUserId('');
      setAmount('');
    }
  };
  
  // Calculate default amount when user selected
  useEffect(() => {
    if (selectedUserId && balances) {
      const userBalance = balances.balances.find(b => b.userId === selectedUserId);
      if (userBalance) {
        // Use absolute value as the direction is determined by settlementType
        setAmount(Math.abs(userBalance.amount).toFixed(2));
        
        // Set the settlement type based on the balance
        // If user has positive balance (they owe us money), we need to RECEIPT (collect payment)
        // If user has negative balance (we owe them), we need to PAYMENT (make payment)
        setSettlementType(userBalance.amount > 0 ? 'RECEIPT' : 'PAYMENT');
      }
    }
  }, [selectedUserId, balances]);
  
  // Handle back navigation
  const handleBack = () => {
    router.push(`/dashboard/groups/${groupId}`);
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !amount || parseFloat(amount) <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine the initial status based on the settlement type
      // For PAYMENT: The current user is initiating a payment to another user
      // For RECEIPT: The current user is recording that they received money from another user
      
      // When marking a payment (I'm paying someone else), set to PENDING_CONFIRMATION 
      // so they can confirm they received the money
      // When marking a receipt (I'm receiving from someone), set to PENDING
      // because I'm already confirming I received it
      const initialStatus = settlementType === 'PAYMENT' ? 'PENDING_CONFIRMATION' : 'PENDING';
      
      // Create the settlement
      await createSettlement({
        amount: parseFloat(amount),
        currency: selectedCurrency,
        description: description || t('defaultDescription'),
        date: new Date(),
        groupId,
        settledWithUserId: selectedUserId,
        settlementType,
        settlementStatus: initialStatus,
      });
      
      toast.success(t('createSuccess'));
      router.push(`/dashboard/groups/${groupId}`);
      
      // Add a small delay to allow the server to process the settlement
      // before the group page tries to load the balances
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error creating settlement:', error);
      toast.error(t('errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  // Not found state
  if (!group || !balances) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('errors.notFound')}</CardTitle>
            <CardDescription>{t('errors.notFoundDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack}>{t('actions.back')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Filter out users with zero balance
  const usersWithBalance = balances.balances.filter(b => b.amount !== 0);
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('settleUp')}</CardTitle>
          <CardDescription>
            {group.name} - {t('balanceSummary')}
          </CardDescription>
          {hasMultipleCurrencies && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                {tGroups('balances.multiCurrencyDescription')}
              </p>
              <div className="flex items-center gap-2">
                <Label htmlFor="currency">{tGroups('payment.currency')}</Label>
                <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-4">{t('currentBalances')}</h3>
              
              {usersWithBalance.length === 0 ? (
                <p className="text-muted-foreground">
                  {hasMultipleCurrencies 
                    ? tGroups('balances.noCurrencyBalancesYouOweThem') 
                    : t('noBalances')}
                </p>
              ) : (
                <div className="space-y-3">
                  {usersWithBalance.map(balance => (
                    <div
                      key={balance.userId}
                      className="flex items-center justify-between p-3 bg-muted/40 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {balance.image ? (
                            <AvatarImage src={balance.image} alt={balance.name} />
                          ) : null}
                          <AvatarFallback>{getInitials(balance.name)}</AvatarFallback>
                        </Avatar>
                        <span>{balance.name}</span>
                      </div>
                      <span className={balance.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {balance.amount > 0 ? `+${balance.amount.toFixed(2)}` : balance.amount.toFixed(2)} {balance.currency}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">{t('settleUpForm')}</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settlementType">{t('fields.type')}</Label>
                  <Select
                    value={settlementType}
                    onValueChange={(value) => setSettlementType(value as 'PAYMENT' | 'RECEIPT')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('fields.selectType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{t('types.payment')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="RECEIPT">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{t('types.receipt')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="userId">{t('fields.user')}</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={isSubmitting || usersWithBalance.length === 0}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('fields.selectUser')} />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithBalance.map(user => (
                        <SelectItem key={user.userId} value={user.userId}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {user.image ? (
                                <AvatarImage src={user.image} alt={user.name} />
                              ) : null}
                              <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            <span className="text-muted-foreground text-sm">
                              ({user.amount > 0 ? `+${user.amount.toFixed(2)}` : user.amount.toFixed(2)} {user.currency})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('fields.amount')}</Label>
                  <div className="flex">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="rounded-r-none"
                    />
                    <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted">
                      {selectedCurrency}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t('fields.description')}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('fields.descriptionPlaceholder')}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    {t('actions.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !selectedUserId || parseFloat(amount || '0') <= 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('actions.processing')}
                      </>
                    ) : (
                      t('actions.settle')
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 