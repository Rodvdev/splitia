import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { STRIPE_CONFIG } from '@/lib/subscription';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;

  if (!userId || !planType) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId,
      planType: planType as any,
      status: 'ACTIVE',
      startDate: new Date(),
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: session.customer as string,
      autoRenew: true,
      pricePerMonth: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'USD',
    }
  });

  console.log(`Subscription created for user ${userId} with plan ${planType}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planType = subscription.metadata?.planType;

  if (!userId || !planType) {
    console.error('Missing metadata in subscription:', subscription.id);
    return;
  }

  // Update subscription record if it exists
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status.toUpperCase() as any,
      endDate: new Date(subscription.current_period_end * 1000),
    }
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Update subscription status
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: subscription.status.toUpperCase() as any,
      endDate: new Date(subscription.current_period_end * 1000),
    }
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Mark subscription as cancelled
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELLED',
      endDate: new Date(),
      autoRenew: false,
    }
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    }
  });

  if (!subscription) return;

  // Create payment record
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeChargeId: invoice.charge as string,
      description: `Payment for ${subscription.planType} plan`,
    }
  });

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'ACTIVE',
      endDate: new Date(invoice.period_end * 1000),
    }
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    }
  });

  if (!subscription) return;

  // Create failed payment record
  await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: subscription.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'FAILED',
      stripePaymentIntentId: invoice.payment_intent as string,
      description: `Failed payment for ${subscription.planType} plan`,
    }
  });

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'PAST_DUE',
    }
  });
}
