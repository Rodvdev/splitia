'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Building, Zap } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

interface PlanProps {
  planId: string;
  plan: any;
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

function PlanCard({ planId, plan, currentPlan, onSelectPlan, isLoading }: PlanProps) {
  const isCurrentPlan = currentPlan === planId;
  const isFree = planId === 'FREE';
  
  const getIcon = () => {
    switch (planId) {
      case 'FREE':
        return <Zap className="h-6 w-6 text-blue-500" />;
      case 'PREMIUM':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'ENTERPRISE':
        return <Building className="h-6 w-6 text-purple-500" />;
      default:
        return <Zap className="h-6 w-6 text-blue-500" />;
    }
  };

  const getCardStyle = () => {
    if (isCurrentPlan) {
      return 'border-primary bg-primary/5';
    }
    if (planId === 'PREMIUM') {
      return 'border-yellow-500 shadow-lg scale-105';
    }
    return '';
  };

  return (
    <Card className={`relative ${getCardStyle()}`}>
      {planId === 'PREMIUM' && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500">
          Más Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {getIcon()}
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-lg">
          {plan.description}
        </CardDescription>
        
        <div className="mt-4">
          <span className="text-4xl font-bold">
            ${plan.price}
          </span>
          <span className="text-muted-foreground">/mes</span>
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'secondary' : 'default'}
          onClick={() => onSelectPlan(planId)}
          disabled={isCurrentPlan || isLoading}
        >
          {isCurrentPlan ? 'Plan Actual' : isFree ? 'Seleccionar' : 'Suscribirse'}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

export function SubscriptionPlans({ currentPlan, onSelectPlan, isLoading }: SubscriptionPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => (
        <PlanCard
          key={planId}
          planId={planId}
          plan={plan}
          currentPlan={currentPlan}
          onSelectPlan={onSelectPlan}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
