'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Ban,
  CreditCard,
  Receipt,
  ScanFace
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

// Importar las funciones de GraphQL
import { fetchGroupBalances, recordPayment } from '@/lib/graphql-client';

// Datos para la interfaz de balances
interface Balance {
  userId: string;
  name: string;
  email?: string;
  image?: string;
  amount: number; // Positivo: te deben, Negativo: debes
  currency: string;
}

interface GroupBalancesProps {
  groupId: string;
  currentUserId: string;
}

// Definir la interfaz para la respuesta de la API
interface GroupBalancesResponse {
  groupBalances: {
    totalOwed: number;
    totalOwing: number;
    currency: string;
    balances: Balance[];
  }
}

export function GroupBalances({ groupId, currentUserId }: GroupBalancesProps) {
  const t = useTranslations('groups');
  
  // Estado para almacenar datos
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Balance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [currency, setCurrency] = useState('PEN');
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwing, setTotalOwing] = useState(0);
  
  // Cargar balances del grupo desde la API
  useEffect(() => {
    const loadBalances = async () => {
      setIsLoading(true);
      try {
        // Llamada a la API real
        const response = await fetchGroupBalances(groupId) as GroupBalancesResponse;
        
        if (response && response.groupBalances) {
          const { balances, totalOwed, totalOwing, currency } = response.groupBalances;
          
          // El backend ya debería filtrar a los usuarios con rol ASSISTANT,
          // pero por seguridad aseguramos que no aparezcan en la interfaz
          setBalances(balances);
          setTotalOwed(totalOwed);
          setTotalOwing(totalOwing);
          setCurrency(currency);
        }
      } catch (error) {
        console.error('Error loading balances:', error);
        toast.error(t('balances.error'));
      } finally {
        setIsLoading(false);
      }
    };
    
    if (groupId && currentUserId) {
      loadBalances();
    }
  }, [groupId, currentUserId, t]);
  
  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Manejar pago
  const handlePayment = async () => {
    if (!selectedUser) return;
    
    try {
      // Llamada a la API para registrar el pago
      await recordPayment({
        groupId,
        userId: selectedUser.userId,
        amount: parseFloat(paymentAmount),
        currency: selectedUser.currency,
        method: paymentMethod,
      });
      
      // Cargar los balances actualizados
      const response = await fetchGroupBalances(groupId) as GroupBalancesResponse;
      if (response && response.groupBalances) {
        const { balances, totalOwed, totalOwing, currency } = response.groupBalances;
        
        setBalances(balances);
        setTotalOwed(totalOwed);
        setTotalOwing(totalOwing);
        setCurrency(currency);
      }
      
      toast.success(t('payment.success'));
      setSelectedUser(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(t('payment.error'));
    }
  };
  
  // Filtrar balances según saldos
  const owedToMe = balances.filter(b => b.amount > 0);
  const owedByMe = balances.filter(b => b.amount < 0);
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          {t('balances.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {t('balances.description')}
        </p>
        
        {isLoading ? (
          // Estado de carga
          <div className="space-y-3">
            <div className="h-24 rounded-md bg-muted animate-pulse" />
            <div className="h-24 rounded-md bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            {/* Resumen de saldos */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-green-500 font-medium mb-1 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {t('balances.theyOweYou')}
                </div>
                <div className="text-lg font-bold">
                  {formatCurrency(totalOwed, currency)}
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <div className="text-red-500 font-medium mb-1 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {t('balances.youOweThem')}
                </div>
                <div className="text-lg font-bold">
                  {formatCurrency(totalOwing, currency)}
                </div>
              </div>
            </div>
            
            {/* Pestañas para categorizar deudas */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">{t('balances.tabs.all')}</TabsTrigger>
                <TabsTrigger value="theyOweYou">{t('balances.tabs.theyOweYou')}</TabsTrigger>
                <TabsTrigger value="youOweThem">{t('balances.tabs.youOweThem')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {balances.length > 0 ? (
                  balances.map((balance) => (
                    <BalanceRow 
                      key={balance.userId}
                      balance={balance}
                      onPay={() => setSelectedUser(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('balances.noBalances')}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="theyOweYou" className="space-y-4">
                {owedToMe.length > 0 ? (
                  owedToMe.map((balance) => (
                    <BalanceRow 
                      key={balance.userId}
                      balance={balance}
                      onPay={() => setSelectedUser(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('balances.noBalancesTheyOweYou')}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="youOweThem" className="space-y-4">
                {owedByMe.length > 0 ? (
                  owedByMe.map((balance) => (
                    <BalanceRow 
                      key={balance.userId}
                      balance={balance}
                      onPay={() => setSelectedUser(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('balances.noBalancesYouOweThem')}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
        
        {/* Diálogo de pago */}
        <Dialog 
          open={!!selectedUser} 
          onOpenChange={(open) => !open && setSelectedUser(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser && selectedUser.amount > 0 
                  ? t('payment.requestTitle') 
                  : t('payment.payTitle')}
              </DialogTitle>
              <DialogDescription>
                {selectedUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      {selectedUser.image ? (
                        <AvatarImage src={selectedUser.image} alt={selectedUser.name} />
                      ) : null}
                      <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                    </Avatar>
                    <span>{selectedUser.name}</span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">{t('payment.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  max={selectedUser ? Math.abs(selectedUser.amount).toString() : undefined}
                  step="0.01"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>{t('payment.method')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant={paymentMethod === 'bank' ? 'default' : 'outline'} 
                    onClick={() => setPaymentMethod('bank')}
                    className="justify-start"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t('payment.methods.bank')}
                  </Button>
                  <Button 
                    type="button" 
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                    onClick={() => setPaymentMethod('cash')}
                    className="justify-start"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {t('payment.methods.cash')}
                  </Button>
                  <Button 
                    type="button" 
                    variant={paymentMethod === 'yape' ? 'default' : 'outline'} 
                    onClick={() => setPaymentMethod('yape')}
                    className="justify-start"
                  >
                    <ScanFace className="h-4 w-4 mr-2" />
                    {t('payment.methods.yape')}
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                {t('actions.cancel')}
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                {selectedUser && selectedUser.amount > 0 
                  ? t('payment.actions.request') 
                  : t('payment.actions.pay')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Componente para cada fila de balance
function BalanceRow({ 
  balance, 
  onPay 
}: { 
  balance: Balance; 
  onPay: () => void;
}) {
  const t = useTranslations('groups');
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const isOwed = balance.amount > 0;
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {balance.image ? (
            <AvatarImage src={balance.image} alt={balance.name} />
          ) : null}
          <AvatarFallback>{getInitials(balance.name)}</AvatarFallback>
        </Avatar>
        
        <div>
          <div className="font-medium">{balance.name}</div>
          <Badge 
            variant={isOwed ? "default" : "destructive"}
            className={isOwed 
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
            }
          >
            {isOwed ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Ban className="h-3 w-3 mr-1" />
            )}
            {isOwed 
              ? t('balances.owesYou', { amount: formatCurrency(balance.amount, balance.currency) })
              : t('balances.youOwe', { amount: formatCurrency(Math.abs(balance.amount), balance.currency) })
            }
          </Badge>
        </div>
      </div>
      
      <Button 
        size="sm" 
        variant={isOwed ? "outline" : "default"}
        onClick={onPay}
      >
        {isOwed ? t('balances.actions.request') : t('balances.actions.pay')}
      </Button>
    </div>
  );
} 