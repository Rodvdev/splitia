import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SupportPageClient } from './page-client';

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Soporte</h1>
          <p className="text-muted-foreground">
            Obtén ayuda con tu cuenta o reporta problemas
          </p>
        </div>
        
        <Suspense fallback={<div>Cargando...</div>}>
          <SupportPageClient userId={session.user.id} />
        </Suspense>
      </div>
    </div>
  );
}
