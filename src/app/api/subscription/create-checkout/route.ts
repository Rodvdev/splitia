import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { STRIPE_CONFIG, SUBSCRIPTION_PLANS } from '@/lib/subscription';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { planType } = await request.json();

    if (!planType || !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { success: false, error: 'Tipo de plan inválido' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'PAST_DUE']
        }
      }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una suscripción activa' },
        { status: 400 }
      );
    }

    // For free plan, create subscription directly
    if (planType === 'FREE') {
      const subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planType: 'FREE',
          status: 'ACTIVE',
          startDate: new Date(),
          autoRenew: false,
          pricePerMonth: 0,
          currency: 'USD',
        }
      });

      return NextResponse.json({
        success: true,
        data: { subscriptionId: subscription.id, redirectUrl: '/dashboard?upgraded=true' }
      });
    }

    // For paid plans, create Stripe checkout session
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Create or get Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: `${user.name} ${user.lastName}`,
        metadata: {
          userId: session.user.id,
        }
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_CONFIG.priceIds[planType as keyof typeof STRIPE_CONFIG.priceIds],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?cancelled=true`,
      metadata: {
        userId: session.user.id,
        planType,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          planType,
        },
        trial_period_days: 14, // 14-day free trial
      },
    });

    return NextResponse.json({
      success: true,
      data: { 
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id 
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
