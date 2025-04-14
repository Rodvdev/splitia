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
import { Settings, LogOut, User } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth as useAuthContext } from '@/components/auth/auth-provider';
import { useUserPreferences } from '@/components/user/user-preferences-provider';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

interface UserProfileDisplayProps {
  showDetails?: boolean;
}

export default function UserProfileDisplay({ showDetails = true }: UserProfileDisplayProps) {
  const t = useTranslations();
  const tGreetings = useTranslations('greetings');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { isSigningOut, signOut } = useAuthContext();
  const { preferences, isLoading: isLoadingPreferences } = useUserPreferences();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  
  const [userName, setUserName] = useState<string>('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener datos del usuario de los hooks
  useEffect(() => {
    const initUserData = async () => {
      try {
        setIsLoading(true);
        
        // Obtener la sesión actual
        const session = await getSession();
        
        if (!session) {
          router.push('/sign-in');
          return;
        }
        
        // Establecer información básica del usuario desde la sesión de autenticación
        if (authUser) {
          setUserName(authUser.name || '');
          setUserImage(authUser.image || null);
        }
        
        // Obtener información adicional del perfil a través de los hooks
        if (profile) {
          setUserName(profile.name || userName);
        }
        
      } catch (error) {
        console.error('Error inicializando datos de usuario:', error);
        toast.error(tErrors('fetchProfile') || 'Error fetching your profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    initUserData();
  }, [router, authUser, userName, tErrors, profile]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userLanguage = preferences.language;
    
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

  // Versión simple (solo avatar)
  if (!showDetails) {
    return (
      <div className="flex items-center">
        {isLoading || isLoadingPreferences || isLoadingProfile ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 cursor-pointer">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName} />
                ) : null}
                <AvatarFallback>{getInitials(userName || 'User')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{userName || t('user.guest')}</p>
                  {preferences.currency && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {preferences.currency}
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('navigation.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('navigation.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                variant="destructive" 
                onClick={() => signOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isSigningOut ? t('common.loading') : t('auth.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Versión completa con detalles del usuario
  return (
    <div className="flex items-center gap-3">
      {isLoading || isLoadingPreferences || isLoadingProfile ? (
        <>
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </>
      ) : (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-12 w-12 cursor-pointer">
                {userImage ? (
                  <AvatarImage src={userImage} alt={userName} />
                ) : null}
                <AvatarFallback>{getInitials(userName || 'User')}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{userName || t('user.guest')}</p>
                  {preferences.currency && (
                    <Badge variant="outline" className="text-xs w-fit">
                      {preferences.currency}
                    </Badge>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>{t('navigation.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('navigation.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                variant="destructive" 
                onClick={() => signOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isSigningOut ? t('common.loading') : t('auth.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{userName || t('user.guest')}</p>
              {preferences.currency && (
                <Badge variant="outline" className="text-xs">
                  {preferences.currency}
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