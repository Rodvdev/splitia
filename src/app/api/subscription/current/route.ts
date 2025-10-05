import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get user's current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'PAST_DUE']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // If no active subscription, return free plan
    const currentPlan = subscription?.planType || 'FREE';
    const planConfig = SUBSCRIPTION_PLANS[currentPlan as keyof typeof SUBSCRIPTION_PLANS];

    return NextResponse.json({
      success: true,
      data: {
        plan: currentPlan,
        planConfig,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          autoRenew: subscription.autoRenew,
          lastPayment: subscription.payments[0] || null,
        } : null,
      }
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener la suscripción actual' },
      { status: 500 }
    );
  }
}
