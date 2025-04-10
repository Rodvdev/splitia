'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { getSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface UserProfileDisplayProps {
  showDetails?: boolean;
}

export default function UserProfileDisplay({ showDetails = true }: UserProfileDisplayProps) {
  const t = useTranslations();
  const tGreetings = useTranslations('greetings');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [userName, setUserName] = useState<string>('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState<string>('');
  const [userLanguage, setUserLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get current session
        const session = await getSession();
        
        if (!session) {
          router.push('/sign-in');
          return;
        }
        
        // Set basic user info from auth session
        if (authUser) {
          setUserName(authUser.name || '');
          setUserImage(authUser.image || null);
        }
        
        // Fetch additional user profile from database
        const response = await fetch('/api/profile/get', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserName(data.user.name || userName);
            setUserCurrency(data.user.currency || 'PEN');
            setUserLanguage(data.user.language || 'es');
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error(tErrors('fetchProfile') || 'Error fetching your profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [router, authUser, userName, tErrors]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (userLanguage === 'en') {
      if (hour < 12) return tGreetings('morning');
      if (hour < 19) return tGreetings('afternoon');
      return tGreetings('evening');
    } else if (userLanguage === 'pt') {
      if (hour < 12) return 'Bom dia';
      if (hour < 19) return 'Boa tarde';
      return 'Boa noite';
    } else {
      // Español por defecto
      if (hour < 12) return 'Buenos días';
      if (hour < 19) return 'Buenas tardes';
      return 'Buenas noches';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Simple version (avatar only)
  if (!showDetails) {
    return (
      <div className="flex items-center">
        {isLoading ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : (
          <Avatar className="h-9 w-9 cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
            {userImage ? (
              <AvatarImage src={userImage} alt={userName} />
            ) : null}
            <AvatarFallback>{getInitials(userName || 'User')}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  // Full version with user details
  return (
    <div className="flex items-center gap-3">
      {isLoading ? (
        <>
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </>
      ) : (
        <>
          <Avatar className="h-12 w-12 cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
            {userImage ? (
              <AvatarImage src={userImage} alt={userName} />
            ) : null}
            <AvatarFallback>{getInitials(userName || 'User')}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{userName || t('user.guest')}</p>
              {userCurrency && (
                <Badge variant="outline" className="text-xs">
                  {userCurrency}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {`${getGreeting()}, ${userName.split(' ')[0] || t('user.guest')}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
} 