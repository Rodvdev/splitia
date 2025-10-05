import { SubscriptionPlan, SubscriptionStatus, PaymentStatus } from '@prisma/client';

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Plan Gratuito',
    description: 'Funcionalidades básicas para gestión personal de gastos',
    price: 0,
    currency: 'USD',
    features: [
      'Gastos personales ilimitados',
      'Hasta 3 grupos',
      'Análisis básicos',
      'Soporte por email',
    ],
    limitations: {
      maxGroups: 3,
      maxGroupMembers: 5,
      aiAssistant: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Plan Premium',
    description: 'Funcionalidades avanzadas con IA y análisis detallados',
    price: 9.99,
    currency: 'USD',
    features: [
      'Todo del plan gratuito',
      'Grupos ilimitados',
      'Asistente de IA',
      'Análisis avanzados y predicciones',
      'Soporte prioritario',
      'Exportación de datos',
      'Categorías personalizadas ilimitadas',
    ],
    limitations: {
      maxGroups: -1, // Unlimited
      maxGroupMembers: -1, // Unlimited
      aiAssistant: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Plan Empresarial',
    description: 'Solución completa para empresas con funciones administrativas',
    price: 29.99,
    currency: 'USD',
    features: [
      'Todo del plan Premium',
      'Panel administrativo',
      'Gestión de usuarios empresariales',
      'Integraciones personalizadas',
      'Soporte 24/7',
      'Reportes empresariales',
      'API personalizada',
    ],
    limitations: {
      maxGroups: -1,
      maxGroupMembers: -1,
      aiAssistant: true,
      advancedAnalytics: true,
      prioritySupport: true,
      enterpriseFeatures: true,
    },
  },
} as const;

export type SubscriptionPlanConfig = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS];

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceIds: {
    premium: process.env.STRIPE_PREMIUM_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  },
};

// Subscription utility functions
export function canUserAccessFeature(
  userPlan: SubscriptionPlan,
  feature: keyof SubscriptionPlanConfig['limitations']
): boolean {
  const planConfig = SUBSCRIPTION_PLANS[userPlan];
  return planConfig.limitations[feature] === true || planConfig.limitations[feature] === -1;
}

export function getUserPlanLimits(userPlan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[userPlan].limitations;
}

export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE;
}

export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return status === PaymentStatus.SUCCEEDED;
}

// Subscription validation
export function validateSubscriptionUpgrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): { valid: boolean; reason?: string } {
  if (currentPlan === targetPlan) {
    return { valid: false, reason: 'Ya tienes este plan activo' };
  }

  const planOrder = [SubscriptionPlan.FREE, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);

  if (targetIndex <= currentIndex) {
    return { valid: false, reason: 'No puedes degradar tu plan directamente' };
  }

  return { valid: true };
}

// Billing cycle calculations
export function calculateBillingCycle(startDate: Date, planType: SubscriptionPlan): {
  nextBillingDate: Date;
  isAnnual: boolean;
} {
  const nextBillingDate = new Date(startDate);
  
  if (planType === SubscriptionPlan.FREE) {
    // Free plan doesn't have billing cycles
    return { nextBillingDate, isAnnual: false };
  }

  // All paid plans are monthly for now
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  
  return { nextBillingDate, isAnnual: false };
}

// Trial period management
export function getTrialPeriod(): { startDate: Date; endDate: Date } {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 14-day trial
  
  return { startDate, endDate };
}

export function isTrialExpired(trialEndDate: Date): boolean {
  return new Date() > trialEndDate;
}

// Subscription analytics
export function calculateSubscriptionMetrics(subscriptions: any[]) {
  const metrics = {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter(sub => sub.status === SubscriptionStatus.ACTIVE).length,
    revenue: subscriptions
      .filter(sub => sub.status === SubscriptionStatus.ACTIVE)
      .reduce((sum, sub) => sum + (sub.pricePerMonth || 0), 0),
    planDistribution: {
      free: subscriptions.filter(sub => sub.planType === SubscriptionPlan.FREE).length,
      premium: subscriptions.filter(sub => sub.planType === SubscriptionPlan.PREMIUM).length,
      enterprise: subscriptions.filter(sub => sub.planType === SubscriptionPlan.ENTERPRISE).length,
    },
  };

  return metrics;
}
