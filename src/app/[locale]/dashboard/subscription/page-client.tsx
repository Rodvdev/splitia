'use client';

import { useState, useEffect } from 'react';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';
import { SubscriptionManagement } from '@/components/subscription/SubscriptionManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface SubscriptionData {
  plan: string;
  planConfig: any;
  subscription: any;
}

interface SubscriptionPageClientProps {
  userId: string;
}

export function SubscriptionPageClient({ userId }: SubscriptionPageClientProps) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/current');
      const data = await response.json();

      if (data.success) {
        setSubscriptionData(data.data);
      } else {
        setError(data.error || 'Error al cargar la suscripción');
      }
    } catch (err) {
      setError('Error al cargar la suscripción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'FREE') {
      // Handle free plan selection
      return;
    }

    try {
      setIsUpgrading(true);
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planType: planId }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.checkoutUrl) {
          // Redirect to Stripe checkout
          window.location.href = data.data.checkoutUrl;
        } else if (data.data.redirectUrl) {
          // Redirect to success page
          window.location.href = data.data.redirectUrl;
        }
      } else {
        setError(data.error || 'Error al procesar la suscripción');
      }
    } catch (err) {
      setError('Error al procesar la suscripción');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = () => {
    // Redirect to Stripe customer portal
    window.open('/api/subscription/customer-portal', '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando información de suscripción...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs defaultValue="plans" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="plans">Planes Disponibles</TabsTrigger>
        <TabsTrigger value="management">Mi Suscripción</TabsTrigger>
      </TabsList>
      
      <TabsContent value="plans" className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Elige tu Plan</h2>
          <p className="text-muted-foreground">
            Selecciona el plan que mejor se adapte a tus necesidades
          </p>
        </div>
        
        <SubscriptionPlans
          currentPlan={subscriptionData?.plan}
          onSelectPlan={handleSelectPlan}
          isLoading={isUpgrading}
        />
      </TabsContent>
      
      <TabsContent value="management" className="space-y-6">
        {subscriptionData && (
          <SubscriptionManagement
            subscription={subscriptionData.subscription}
            planConfig={subscriptionData.planConfig}
            onUpgrade={() => handleSelectPlan('PREMIUM')}
            onManageBilling={handleManageBilling}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
