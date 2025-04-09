'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function JoinGroupContent() {
  const t = useTranslations('groups');
  const greetingsT = useTranslations('greetings');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const requireEmail = searchParams?.has('requireEmail') || false;
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteData, setInviteData] = useState<{
    maxUses?: number;
    usedCount?: number;
    expired?: boolean;
    error?: string;
    group?: {
      name?: string;
    };
  }>({});
  const [groupDetails, setGroupDetails] = useState<{
    id?: string;
    name?: string;
    members?: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string;
    }>;
  }>({});

  const handleJoinGroup = useCallback(async () => {
    setJoining(true);

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation JoinGroupByToken($token: String!, $email: String) {
              joinGroupByToken(token: $token, email: $email) {
                success
                message
                group {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            token,
            email: requireEmail && !session ? email : undefined,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
      } else {
        const { success, message, group } = result.data.joinGroupByToken;
        
        if (success) {
          toast.success(t('successJoining'));
          
          // Navigate to the group's page
          setTimeout(() => {
            if (group?.id) {
              router.push(`/dashboard/groups/${group.id}`);
            } else {
              router.push('/dashboard/groups');
            }
          }, 1500);
        } else {
          toast.error(message || t('errorJoining'));
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(t('errorJoining'));
    } finally {
      setJoining(false);
    }
  }, [token, requireEmail, session, email, t, router]);

  const checkUserExists = useCallback(async () => {
    if (!email) return;
    
    setCheckingEmail(true);
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query CheckUserExists($email: String!) {
              checkUserExists(email: $email) {
                exists
              }
            }
          `,
          variables: {
            email,
          },
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        toast.error(result.errors[0].message);
        return;
      }
      
      const { exists } = result.data.checkUserExists;
      
      if (exists) {
        // User exists, redirect to login with callbackUrl to return here
        const callbackUrl = encodeURIComponent(`/join?token=${token}${requireEmail ? '&requireEmail=true' : ''}`);
        router.push(`/sign-in?callbackUrl=${callbackUrl}&email=${encodeURIComponent(email)}`);
      } else {
        // User doesn't exist, redirect to registration with callbackUrl to return here
        const callbackUrl = encodeURIComponent(`/join?token=${token}${requireEmail ? '&requireEmail=true' : ''}`);
        router.push(`/sign-up?callbackUrl=${callbackUrl}&email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error('Error checking if user exists:', error);
      toast.error(t('errorCheckingEmail'));
    } finally {
      setCheckingEmail(false);
    }
  }, [email, token, requireEmail, router, t]);

  // Fetch group details if user is authenticated
  const fetchGroupDetails = useCallback(async () => {
    if (!token || status !== 'authenticated') return;

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetGroupDetailsFromToken($token: String!) {
              getGroupDetailsFromToken(token: $token) {
                id
                name
                members {
                  id
                  name
                  email
                  image
                  role
                }
              }
            }
          `,
          variables: {
            token,
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('Error fetching group details:', result.errors);
      } else if (result.data?.getGroupDetailsFromToken) {
        setGroupDetails(result.data.getGroupDetailsFromToken);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  }, [token, status]);

  // Verify token when page loads
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setInviteData({ error: t('invalidInviteLink') });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query VerifyInviteToken($token: String!) {
                verifyInviteToken(token: $token) {
                  id
                  maxUses
                  usedCount
                  expiresAt
                  url
                  group {
                    name
                  }
                }
              }
            `,
            variables: {
              token,
            },
          }),
        });

        const result = await response.json();

        if (result.errors) {
          setInviteData({ error: result.errors[0].message });
        } else {
          const data = result.data.verifyInviteToken;
          setInviteData({
            group: {
              name: data.group.name,
            },
            maxUses: data.maxUses,
            usedCount: data.usedCount,
            expired: data.expiresAt && new Date(data.expiresAt) < new Date(),
          });

          // If user is logged in, fetch group details
          if (status === 'authenticated') {
            await fetchGroupDetails();
            
            // If email is not required, proceed to join automatically
            if (!requireEmail) {
              handleJoinGroup();
            }
          }
        }
      } catch (error) {
        console.error('Error verifying invite token:', error);
        setInviteData({ error: t('errorVerifyingInvite') });
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, status, requireEmail, t, handleJoinGroup, fetchGroupDetails]);

  // Handle case where no token is provided
  if (!token) {
    return (
      <div className="container mx-auto py-10 max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('invalidInviteLink')}</CardTitle>
            <CardDescription>
              {t('invalidInviteLinkDescription')}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard/groups')}>
              {t('backToGroups')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-md flex flex-col items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>{t('verifyingInvitation')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if there's an issue with the invite
  if (inviteData.error || inviteData.expired) {
    return (
      <div className="container mx-auto py-10 max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('invalidInvite')}</CardTitle>
            <CardDescription>
              {inviteData.expired 
                ? t('inviteExpired')
                : inviteData.error || t('inviteError')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('error')}</AlertTitle>
              <AlertDescription>
                {inviteData.expired 
                  ? t('inviteExpiredDescription')
                  : inviteData.error || t('inviteErrorDescription')}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/dashboard/groups')}>
              {t('backToGroups')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Get admin and first two members if available
  const admin = groupDetails.members?.find(member => member.role === 'ADMIN');
  const regularMembers = groupDetails.members?.filter(member => member.role !== 'ADMIN')?.slice(0, 2) || [];
  const totalMembers = groupDetails.members?.length || 0;
  const hasGroupDetails = !!groupDetails.name && totalMembers > 0;
  const isAuthenticated = status === 'authenticated';
  
  // Get the current hour to determine greeting
  const currentHour = new Date().getHours();
  let greeting = '';
  
  if (currentHour < 12) {
    greeting = greetingsT('morning');
  } else if (currentHour < 18) {
    greeting = greetingsT('afternoon');
  } else {
    greeting = greetingsT('evening');
  }
  
  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {t('joinGroup')}
          </CardTitle>
          {isAuthenticated && session?.user?.name && (
            <div className="mt-2 text-sm text-primary font-medium">
              {`${greeting}, ${session.user.name}`}
            </div>
          )}
          <CardDescription>
            {inviteData.group?.name 
              ? t('joinGroupNamed', { name: inviteData.group.name })
              : t('joinGroupGeneric')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show usage info if available */}
          {inviteData.maxUses && (
            <div className="text-sm text-muted-foreground">
              {t('inviteUsageCount', { current: inviteData.usedCount || 0, max: inviteData.maxUses })}
            </div>
          )}

          {/* Show group details if authenticated and available */}
          {isAuthenticated && hasGroupDetails && (
            <div className="space-y-4">
              <div className="text-sm font-medium">
                {t('groupMembers')}:
              </div>
              
              {/* Admin */}
              {admin && (
                <div className="flex items-center space-x-3 py-2 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={admin.image} alt={admin.name} />
                    <AvatarFallback>{admin.name?.charAt(0) || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{admin.name}</div>
                    <div className="text-xs text-muted-foreground">{admin.email}</div>
                  </div>
                  <div className="text-xs font-medium text-primary">
                    {t('admin')}
                  </div>
                </div>
              )}
              
              {/* Other members */}
              {regularMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-3 py-2 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback>{member.name?.charAt(0) || 'M'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                </div>
              ))}
              
              {/* Show total count if there are more members */}
              {totalMembers > 3 && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  {t('andMoreMembers', { count: totalMembers - 3 })}
                </div>
              )}
            </div>
          )}

          {/* Show email input ONLY if not authenticated */}
          {!isAuthenticated && (
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={joining || checkingEmail}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t('emailNeededToJoin')}
              </p>
            </div>
          )}

          {isAuthenticated && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{t('authenticated')}</AlertTitle>
              <AlertDescription>
                {t('authenticatedDescription')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {isAuthenticated ? (
            <Button 
              className="w-full" 
              onClick={handleJoinGroup}
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('joining')}
                </>
              ) : (
                t('joinNow')
              )}
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={checkUserExists}
              disabled={checkingEmail || !email}
            >
              {checkingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('checking')}
                </>
              ) : (
                t('continue')
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/dashboard/groups')}
            disabled={joining || checkingEmail}
          >
            {t('cancel')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function JoinGroupFallback() {
  return (
    <div className="container mx-auto py-10 max-w-md flex flex-col items-center justify-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<JoinGroupFallback />}>
      <JoinGroupContent />
    </Suspense>
  );
} 