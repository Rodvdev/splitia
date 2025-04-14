'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PlusCircle, ArrowDown, ArrowUp, Check, Clock, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { fetchSettlements, confirmSettlement, updateSettlementStatus } from '@/lib/graphql-client';

interface SettlementsTabProps {
  groupId: string;
  currentUserId: string;
  onSettlementUpdate?: () => void;
}

interface Settlement {
  id: string;
  amount: number;
  currency: string;
  date: string;
  description?: string;
  settlementStatus: 'PENDING' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  settlementType: 'PAYMENT' | 'RECEIPT';
  initiatedBy: {
    id: string;
    name: string;
    image?: string;
  };
  settledWithUser: {
    id: string;
    name: string;
    image?: string;
  };
}

export function SettlementsTab({ groupId, currentUserId, onSettlementUpdate }: SettlementsTabProps) {
  const router = useRouter();
  const t = useTranslations('settlements');
  
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Fetch settlements when component mounts
  useEffect(() => {
    const loadSettlements = async () => {
      setIsLoading(true);
      try {
        const status = filter === 'ALL' ? undefined : 
                      filter === 'PENDING' ? 'PENDING' : 
                      filter === 'COMPLETED' ? 'COMPLETED' : 'CONFIRMED';
        
        interface SettlementsResponse {
          settlements: Settlement[];
        }
        
        const response = await fetchSettlements(groupId, undefined, status as 'PENDING' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | undefined) as SettlementsResponse;
        if (response?.settlements) {
          setSettlements(response.settlements);
        }
      } catch (error) {
        console.error('Error fetching settlements:', error);
        toast.error(t('errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettlements();
  }, [groupId, filter, t]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Handle new settlement
  const handleNewSettlement = () => {
    router.push(`/dashboard/groups/${groupId}/settle-up`);
  };
  
  // Check if the current user can confirm this settlement
  const canConfirm = (settlement: Settlement) => {
    return (
      settlement.settlementStatus === 'PENDING_CONFIRMATION' &&
      (
        (settlement.initiatedBy.id === currentUserId && settlement.settlementType === 'RECEIPT') ||
        (settlement.settledWithUser.id === currentUserId && settlement.settlementType === 'PAYMENT')
      )
    );
  };
  
  // Check if the current user can mark this settlement as completed
  const canComplete = (settlement: Settlement) => {
    return (
      settlement.settlementStatus === 'CONFIRMED' &&
      settlement.initiatedBy.id === currentUserId
    );
  };
  
  // Confirm settlement
  const handleConfirm = async (settlementId: string) => {
    setProcessingId(settlementId);
    try {
      await confirmSettlement(settlementId);
      
      // Update the local state
      setSettlements(settlements.map(s => 
        s.id === settlementId ? { ...s, settlementStatus: 'CONFIRMED' } : s
      ));
      
      toast.success(t('confirmSuccess'));
      
      // Notify parent component to refresh balances
      if (onSettlementUpdate) {
        onSettlementUpdate();
      }
    } catch (error) {
      console.error('Error confirming settlement:', error);
      toast.error(t('errors.confirmFailed'));
    } finally {
      setProcessingId(null);
    }
  };
  
  // Update settlement status
  const handleUpdateStatus = async (settlementId: string, status: 'PENDING' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    setProcessingId(settlementId);
    try {
      await updateSettlementStatus(settlementId, status);
      
      // Update the local state
      setSettlements(settlements.map(s => 
        s.id === settlementId ? { ...s, settlementStatus: status } : s
      ));
      
      toast.success(t('statusUpdateSuccess'));
      
      // Notify parent component to refresh balances if status is CONFIRMED or COMPLETED
      if ((status === 'CONFIRMED' || status === 'COMPLETED') && onSettlementUpdate) {
        onSettlementUpdate();
      }
    } catch (error) {
      console.error('Error updating settlement status:', error);
      toast.error(t('errors.statusUpdateFailed'));
    } finally {
      setProcessingId(null);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('filters.all')}</SelectItem>
            <SelectItem value="PENDING">{t('filters.pending')}</SelectItem>
            <SelectItem value="CONFIRMED">{t('filters.confirmed')}</SelectItem>
            <SelectItem value="COMPLETED">{t('filters.completed')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={handleNewSettlement}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('actions.newSettlement')}
        </Button>
      </div>
      
      {settlements.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">{t('noSettlements')}</p>
            <Button className="mt-4" onClick={handleNewSettlement}>
              {t('actions.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {settlements.map((settlement) => (
            <Card key={settlement.id} className="relative overflow-hidden">
              {/* Status indicator */}
              <div className={`absolute top-0 left-0 h-full w-1 ${
                settlement.settlementStatus === 'CONFIRMED' 
                  ? 'bg-green-500' 
                  : settlement.settlementStatus === 'PENDING_CONFIRMATION'
                  ? 'bg-orange-500'
                  : settlement.settlementStatus === 'COMPLETED'
                  ? 'bg-purple-500'
                  : settlement.settlementStatus === 'CANCELLED'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`} />
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {settlement.settlementType === 'PAYMENT' ? (
                        <ArrowUp className="h-4 w-4 text-red-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-green-500" />
                      )}
                      {settlement.amount.toFixed(2)} {settlement.currency}
                    </CardTitle>
                    <CardDescription>
                      {settlement.description || t('defaultDescription')}
                    </CardDescription>
                  </div>
                  
                  <Badge 
                    variant={
                      settlement.settlementStatus === 'CONFIRMED' || settlement.settlementStatus === 'COMPLETED'
                        ? 'default' 
                        : settlement.settlementStatus === 'PENDING_CONFIRMATION'
                        ? 'outline'
                        : settlement.settlementStatus === 'CANCELLED'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      settlement.settlementStatus === 'CONFIRMED' 
                        ? 'bg-green-500' 
                        : settlement.settlementStatus === 'PENDING_CONFIRMATION'
                        ? 'border-orange-500 text-orange-500'
                        : settlement.settlementStatus === 'COMPLETED'
                        ? 'bg-purple-500'
                        : settlement.settlementStatus === 'CANCELLED'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }
                  >
                    {settlement.settlementStatus === 'CONFIRMED' && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {settlement.settlementStatus === 'COMPLETED' && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {settlement.settlementStatus === 'PENDING_CONFIRMATION' && (
                      <Clock className="mr-1 h-3 w-3" />
                    )}
                    {t(`status.${settlement.settlementStatus.toLowerCase()}`)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    {settlement.settlementType === 'PAYMENT' ? (
                      <p className="text-sm">
                        <span className="font-medium">{settlement.initiatedBy.name}</span> pagó <span className="font-medium">{settlement.amount.toFixed(2)} {settlement.currency}</span> a <span className="font-medium">{settlement.settledWithUser.name}</span>
                      </p>
                    ) : (
                      <p className="text-sm">
                        <span className="font-medium">{settlement.initiatedBy.name}</span> recibió <span className="font-medium">{settlement.amount.toFixed(2)} {settlement.currency}</span> de <span className="font-medium">{settlement.settledWithUser.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  {formatDate(settlement.date)}
                </p>
              </CardContent>
              
              <CardFooter className="pt-0">
                {/* Show confirm button if applicable */}
                {canConfirm(settlement) && (
                  <Button
                    size="sm"
                    onClick={() => handleConfirm(settlement.id)}
                    disabled={!!processingId}
                    className="w-full"
                  >
                    {processingId === settlement.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {t('actions.confirm')}
                  </Button>
                )}
                
                {/* Show request confirmation button for pending settlements if initiated by current user */}
                {settlement.settlementStatus === 'PENDING' && 
                 settlement.initiatedBy.id === currentUserId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(settlement.id, 'PENDING_CONFIRMATION')}
                    disabled={!!processingId}
                    className="w-full"
                  >
                    {processingId === settlement.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Clock className="mr-2 h-4 w-4" />
                    )}
                    {t('actions.requestConfirmation')}
                  </Button>
                )}
                
                {/* Show complete button for confirmed settlements */}
                {canComplete(settlement) && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleUpdateStatus(settlement.id, 'COMPLETED')}
                    disabled={!!processingId}
                    className="w-full bg-green-600 hover:bg-green-700 mt-2"
                  >
                    {processingId === settlement.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {t('actions.markCompleted')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 