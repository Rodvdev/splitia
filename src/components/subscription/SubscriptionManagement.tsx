'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, Settings, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subscription {
  id: string;
  planType: string;
  status: string;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  lastPayment?: {
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  };
}

interface SubscriptionManagementProps {
  subscription: Subscription | null;
  planConfig: any;
  onUpgrade: () => void;
  onManageBilling: () => void;
}

export function SubscriptionManagement({ 
  subscription, 
  planConfig, 
  onUpgrade, 
  onManageBilling 
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Activa</Badge>;
      case 'PAST_DUE':
        return <Badge className="bg-red-500">Vencida</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelada</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'PEN',
    }).format(amount);
  };

  const isExpiringSoon = (endDate?: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Plan Actual
              </CardTitle>
              <CardDescription>
                Gestiona tu suscripción y configuración de facturación
              </CardDescription>
            </div>
            {getStatusBadge(subscription?.status || 'FREE')}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">{planConfig.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Precio</p>
              <p className="text-lg font-semibold">
                ${planConfig.price}/mes
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold">
                {subscription?.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
              </p>
            </div>
          </div>

          {subscription && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de inicio</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(subscription.startDate)}
                  </p>
                </div>
                {subscription.endDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Próximo pago</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(subscription.endDate)}
                    </p>
                  </div>
                )}
              </div>

              {subscription.lastPayment && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Último pago</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>
                          {formatCurrency(subscription.lastPayment.amount, subscription.lastPayment.currency)}
                        </span>
                        <Badge variant={subscription.lastPayment.status === 'SUCCEEDED' ? 'default' : 'destructive'}>
                          {subscription.lastPayment.status === 'SUCCEEDED' ? 'Exitoso' : 'Fallido'}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(subscription.lastPayment.createdAt)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Alerts */}
          {subscription?.status === 'PAST_DUE' && (
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                Tu suscripción está vencida. Por favor, actualiza tu método de pago para continuar usando las funcionalidades premium.
              </AlertDescription>
            </Alert>
          )}

          {isExpiringSoon(subscription?.endDate) && (
            <Alert className="border-yellow-500">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-700">
                Tu suscripción expira pronto. Considera renovar para mantener el acceso a todas las funcionalidades.
              </AlertDescription>
            </Alert>
          )}

          {isExpired(subscription?.endDate) && (
            <Alert className="border-red-500">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">
                Tu suscripción ha expirado. Has sido degradado al plan gratuito.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {subscription?.planType === 'FREE' && (
          <Button onClick={onUpgrade} className="flex-1">
            Actualizar Plan
          </Button>
        )}
        
        {subscription?.planType !== 'FREE' && (
          <>
            <Button variant="outline" onClick={onManageBilling} className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Gestionar Facturación
            </Button>
            <Button variant="outline" onClick={onUpgrade} className="flex-1">
              Cambiar Plan
            </Button>
          </>
        )}
      </div>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades del Plan</CardTitle>
          <CardDescription>
            Funcionalidades disponibles en tu plan actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planConfig.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
