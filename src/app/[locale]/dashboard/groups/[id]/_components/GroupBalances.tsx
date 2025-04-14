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
  ScanFace,
  Coins
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Importar las funciones de GraphQL
import { fetchGroupBalances, fetchGroupBalancesMultiCurrency, recordPayment } from '@/lib/graphql-client';

// Datos para la interfaz de balances
interface Balance {
  userId: string;
  name: string;
  email?: string;
  image?: string;
  amount: number; // Positivo: te deben, Negativo: debes
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

interface GroupBalancesMultiCurrencyResponse {
  groupBalancesMultiCurrency: {
    balancesByCurrency: CurrencyBalanceSummary[];
    balances: MultiCurrencyBalance[];
  }
}

export function GroupBalances({ groupId, currentUserId }: GroupBalancesProps) {
  const t = useTranslations('groups');
  
  // Estado para almacenar datos
  const [balances, setBalances] = useState<Balance[]>([]);
  const [multiCurrencyBalances, setMultiCurrencyBalances] = useState<MultiCurrencyBalance[]>([]);
  const [currencySummaries, setCurrencySummaries] = useState<CurrencyBalanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Balance | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [paymentCurrency, setPaymentCurrency] = useState('');
  const [hasMultipleCurrencies, setHasMultipleCurrencies] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalOwing, setTotalOwing] = useState(0);
  
  // Cargar balances del grupo desde la API
  useEffect(() => {
    const loadBalances = async () => {
      setIsLoading(true);
      try {
        // Obtener la moneda preferida del usuario primero
        let preferredCurrency = 'PEN'; // Default en caso de error
        try {
          const userResponse = await fetch('/api/user/preferences');
          const userData = await userResponse.json();
          if (userData.currency) {
            preferredCurrency = userData.currency;
          }
        } catch (prefError) {
          console.error('Error obteniendo preferencias del usuario:', prefError);
        }
        
        // Intentamos cargar los balances con múltiples monedas primero
        const multiCurrencyResponse = await fetchGroupBalancesMultiCurrency(groupId) as GroupBalancesMultiCurrencyResponse;
        
        if (multiCurrencyResponse && multiCurrencyResponse.groupBalancesMultiCurrency) {
          const { balances, balancesByCurrency } = multiCurrencyResponse.groupBalancesMultiCurrency;
          
          // Guardamos los balances multi-moneda
          setMultiCurrencyBalances(balances);
          setCurrencySummaries(balancesByCurrency);
          
          // Verificamos si hay más de una moneda
          const uniqueCurrencies = balancesByCurrency.map(summary => summary.currency);
          setHasMultipleCurrencies(uniqueCurrencies.length > 1);
          
          if (uniqueCurrencies.length > 0) {
            // Intentamos usar la moneda preferida si está disponible
            const hasPreferredCurrency = uniqueCurrencies.includes(preferredCurrency);
            const defaultCurrency = hasPreferredCurrency ? preferredCurrency : uniqueCurrencies[0];
            setSelectedCurrency(defaultCurrency);
            
            // Actualizamos los totales basados en la moneda seleccionada
            const defaultSummary = balancesByCurrency.find(s => s.currency === defaultCurrency);
            if (defaultSummary) {
              setTotalOwed(defaultSummary.totalOwed);
              setTotalOwing(defaultSummary.totalOwing);
            }
            
            // Convertimos los balances multi-moneda a un formato compatible con la interfaz existente
            const formattedBalances = convertToSingleCurrencyBalances(balances, defaultCurrency);
            setBalances(formattedBalances);
          } else {
            // No hay monedas en los balances, usamos la preferida
            setSelectedCurrency(preferredCurrency);
            setBalances([]);
            setTotalOwed(0);
            setTotalOwing(0);
          }
        } else {
          // Fallback a la API original si la multi-moneda no está disponible
          const response = await fetchGroupBalances(groupId) as GroupBalancesResponse;
          
          if (response && response.groupBalances) {
            const { balances, totalOwed, totalOwing, currency } = response.groupBalances;
            
            setBalances(balances);
            setTotalOwed(totalOwed);
            setTotalOwing(totalOwing);
            setSelectedCurrency(currency || preferredCurrency);
            setHasMultipleCurrencies(false);
          } else {
            // Si no hay respuesta, establecemos la moneda preferida
            setSelectedCurrency(preferredCurrency);
            setBalances([]);
            setTotalOwed(0);
            setTotalOwing(0);
          }
        }
      } catch (error) {
        console.error('Error loading balances:', error);
        toast.error(t('balances.error'));
        
        // Intentamos el fallback a la API original si la multi-moneda falla
        try {
          // Obtener la moneda preferida del usuario como respaldo
          let preferredCurrency = 'PEN';
          try {
            const userResponse = await fetch('/api/user/preferences');
            const userData = await userResponse.json();
            if (userData.currency) {
              preferredCurrency = userData.currency;
            }
          } catch {} // Ignoramos errores aquí
          
          const response = await fetchGroupBalances(groupId) as GroupBalancesResponse;
          if (response && response.groupBalances) {
            const { balances, totalOwed, totalOwing, currency } = response.groupBalances;
            
            setBalances(balances);
            setTotalOwed(totalOwed);
            setTotalOwing(totalOwing);
            setSelectedCurrency(currency || preferredCurrency);
            setHasMultipleCurrencies(false);
          } else {
            // Si no hay respuesta, establecemos la moneda preferida
            setSelectedCurrency(preferredCurrency);
          }
        } catch (fallbackError) {
          console.error('Fallback error loading balances:', fallbackError);
          
          // En caso de error total, establecemos PEN como moneda por defecto
          setSelectedCurrency('PEN');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (groupId && currentUserId) {
      loadBalances();
    }
  }, [groupId, currentUserId, t]);
  
  // Convertir balances multi-moneda a balances de una sola moneda para una moneda dada
  const convertToSingleCurrencyBalances = (multiBalances: MultiCurrencyBalance[], currency: string): Balance[] => {
    return multiBalances
      .map(user => {
        const currencyBalance = user.balances.find(b => b.currency === currency);
        if (!currencyBalance) return null;
        
        return {
          userId: user.userId,
          name: user.name,
          email: user.email,
          image: user.image,
          amount: currencyBalance.amount,
          currency: currency
        } as Balance;
      })
      .filter((balance): balance is Balance => balance !== null);
  };
  
  // Manejar cambio de moneda
  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    
    // Actualizar los totales basados en la moneda seleccionada
    const currencySummary = currencySummaries.find(s => s.currency === currency);
    if (currencySummary) {
      setTotalOwed(currencySummary.totalOwed);
      setTotalOwing(currencySummary.totalOwing);
    }
    
    // Actualizar los balances filtrados por la moneda seleccionada
    const filteredBalances = convertToSingleCurrencyBalances(multiCurrencyBalances, currency);
    setBalances(filteredBalances);
  };
  
  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Preparar para pagar a un usuario
  const preparePayment = (balance: Balance) => {
    setSelectedUser(balance);
    setPaymentCurrency(balance.currency);
    setPaymentAmount(Math.abs(balance.amount).toFixed(2));
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
        currency: paymentCurrency || selectedUser.currency,
        method: paymentMethod,
      });
      
      // Recargar balances
      try {
        const multiCurrencyResponse = await fetchGroupBalancesMultiCurrency(groupId) as GroupBalancesMultiCurrencyResponse;
        
        if (multiCurrencyResponse && multiCurrencyResponse.groupBalancesMultiCurrency) {
          const { balances, balancesByCurrency } = multiCurrencyResponse.groupBalancesMultiCurrency;
          
          setMultiCurrencyBalances(balances);
          setCurrencySummaries(balancesByCurrency);
          
          // Actualizar los balances filtrados por la moneda seleccionada
          const filteredBalances = convertToSingleCurrencyBalances(balances, selectedCurrency);
          setBalances(filteredBalances);
          
          // Actualizar los totales basados en la moneda seleccionada
          const currencySummary = balancesByCurrency.find(s => s.currency === selectedCurrency);
          if (currencySummary) {
            setTotalOwed(currencySummary.totalOwed);
            setTotalOwing(currencySummary.totalOwing);
          }
        }
      } catch {
        // Fallback a la API original
        const response = await fetchGroupBalances(groupId) as GroupBalancesResponse;
        if (response && response.groupBalances) {
          const { balances, totalOwed, totalOwing } = response.groupBalances;
          
          setBalances(balances);
          setTotalOwed(totalOwed);
          setTotalOwing(totalOwing);
        }
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
    <div className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          {t('balances.title')}
        </CardTitle>
        
        {/* Selector de moneda cuando hay múltiples monedas */}
        {hasMultipleCurrencies ? (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue placeholder="Moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencySummaries.map((summary) => (
                  <SelectItem key={summary.currency} value={summary.currency}>
                    {summary.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedCurrency}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {hasMultipleCurrencies 
            ? t('balances.multiCurrencyDescription', { currency: selectedCurrency }) 
            : t('balances.description')}
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
                  {formatCurrency(totalOwed, selectedCurrency)}
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <div className="text-red-500 font-medium mb-1 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {t('balances.youOweThem')}
                </div>
                <div className="text-lg font-bold">
                  {formatCurrency(totalOwing, selectedCurrency)}
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
                      onPay={() => preparePayment(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {hasMultipleCurrencies 
                      ? t('balances.noCurrencyBalances', { currency: selectedCurrency }) 
                      : t('balances.noBalances')}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="theyOweYou" className="space-y-4">
                {owedToMe.length > 0 ? (
                  owedToMe.map((balance) => (
                    <BalanceRow 
                      key={balance.userId}
                      balance={balance}
                      onPay={() => preparePayment(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {hasMultipleCurrencies 
                      ? t('balances.noCurrencyBalancesTheyOweYou', { currency: selectedCurrency }) 
                      : t('balances.noBalancesTheyOweYou')}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="youOweThem" className="space-y-4">
                {owedByMe.length > 0 ? (
                  owedByMe.map((balance) => (
                    <BalanceRow 
                      key={balance.userId}
                      balance={balance}
                      onPay={() => preparePayment(balance)}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {hasMultipleCurrencies 
                      ? t('balances.noCurrencyBalancesYouOweThem', { currency: selectedCurrency }) 
                      : t('balances.noBalancesYouOweThem')}
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
                <div className="flex gap-2">
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    max={selectedUser ? Math.abs(selectedUser.amount).toString() : undefined}
                    step="0.01"
                    className="flex-1"
                  />
                  <div className="w-20">
                    <Select
                      value={paymentCurrency || (selectedUser?.currency || selectedCurrency)}
                      onValueChange={setPaymentCurrency}
                      disabled={!hasMultipleCurrencies}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencySummaries.length > 0 ? (
                          currencySummaries.map((summary) => (
                            <SelectItem key={summary.currency} value={summary.currency}>
                              {summary.currency}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value={selectedCurrency}>
                            {selectedCurrency}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
    </div>
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