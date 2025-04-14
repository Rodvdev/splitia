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

import { fetchGroup, fetchGroupBalances, createSettlement } from '@/lib/graphql-client';

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

export default function SettleUpPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  const t = useTranslations('settlements');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<BalanceSummary | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [settlementType, setSettlementType] = useState<'PAYMENT' | 'RECEIPT'>('PAYMENT');
  
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
        
        // Fetch balances
        interface GroupBalancesResponse {
          groupBalances: BalanceSummary;
        }
        const balancesResponse = await fetchGroupBalances(groupId) as GroupBalancesResponse;
        if (balancesResponse?.groupBalances) {
          setBalances(balancesResponse.groupBalances);
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
  
  // Calculate default amount when user selected
  useEffect(() => {
    if (selectedUserId && balances) {
      const userBalance = balances.balances.find(b => b.userId === selectedUserId);
      if (userBalance) {
        // Use absolute value as the direction is determined by settlementType
        setAmount(Math.abs(userBalance.amount).toFixed(2));
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
      // Determinar el estado inicial - las liquidaciones tipo PAYMENT deben comenzar como PENDING_CONFIRMATION
      // para que la otra persona pueda confirmar que recibió el pago
      const initialStatus = settlementType === 'PAYMENT' ? 'PENDING_CONFIRMATION' : 'PENDING';
      
      // Crear la liquidación
      await createSettlement({
        amount: parseFloat(amount),
        currency: balances?.currency || 'PEN',
        description: description || t('defaultDescription'),
        date: new Date(),
        groupId,
        settledWithUserId: selectedUserId,
        settlementType,
        settlementStatus: initialStatus,
      });
      
      toast.success(t('createSuccess'));
      router.push(`/dashboard/groups/${groupId}`);
      
      // Añadir un pequeño retraso para permitir que el servidor procese la liquidación
      // antes de que la página del grupo intente cargar los balances
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-4">{t('currentBalances')}</h3>
              
              {usersWithBalance.length === 0 ? (
                <p className="text-muted-foreground">{t('noBalances')}</p>
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
                    defaultValue="PAYMENT"
                    onValueChange={(value) => setSettlementType(value as 'PAYMENT' | 'RECEIPT')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
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
                    onValueChange={setSelectedUserId}
                    disabled={isSubmitting || usersWithBalance.length === 0}
                  >
                    <SelectTrigger>
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
                      {balances.currency}
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