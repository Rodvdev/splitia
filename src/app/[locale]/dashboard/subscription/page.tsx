import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubscriptionPageClient } from './page-client';

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Suscripciones</h1>
          <p className="text-muted-foreground">
            Gestiona tu plan de suscripción y accede a funcionalidades premium
          </p>
        </div>
        
        <Suspense fallback={<div>Cargando...</div>}>
          <SubscriptionPageClient userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
