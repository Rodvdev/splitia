import { NextRequest, NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    // Return available subscription plans
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      features: plan.features,
      limitations: plan.limitations,
    }));

    return NextResponse.json({ 
      success: true, 
      data: plans 
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los planes de suscripción' },
      { status: 500 }
    );
  }
}
