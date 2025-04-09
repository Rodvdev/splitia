'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function JoinGroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  const requireEmail = searchParams?.has('requireEmail') || false;
  const { data: session, status } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteData, setInviteData] = useState<{
    groupName?: string;
    maxUses?: number;
    usedCount?: number;
    expired?: boolean;
    error?: string;
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
          toast.success(t('successJoining') || 'Successfully joined the group');
          
          // Navigate to the group's page
          setTimeout(() => {
            if (group?.id) {
              router.push(`/dashboard/groups/${group.id}`);
            } else {
              router.push('/dashboard/groups');
            }
          }, 1500);
        } else {
          toast.error(message || t('errorJoining') || 'Error joining the group');
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(t('errorJoining') || 'Error joining the group');
    } finally {
      setJoining(false);
    }
  }, [token, requireEmail, session, email, t, router]);

  // Verify token when page loads
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setInviteData({ error: t('invalidInviteLink') || 'Invalid invitation link' });
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
            groupName: data.group.name,
            maxUses: data.maxUses,
            usedCount: data.usedCount,
            expired: data.expiresAt && new Date(data.expiresAt) < new Date(),
          });

          // If user is logged in and email is not required, proceed to join automatically
          if (status === 'authenticated' && !requireEmail) {
            handleJoinGroup();
          }
        }
      } catch (error) {
        console.error('Error verifying invite token:', error);
        setInviteData({ error: t('errorVerifyingInvite') || 'Error verifying invitation' });
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, status, requireEmail, t, handleJoinGroup]);

  // Handle case where no token is provided
  if (!token) {
    return (
      <div className="container mx-auto py-10 max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">{t('invalidInviteLink')}</CardTitle>
            <CardDescription>
              {t('invalidInviteLinkDescription') || 'The invitation link is invalid or has been removed.'}
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
            <CardTitle>{t('verifyingInvitation') || 'Verifying invitation'}</CardTitle>
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
            <CardTitle className="text-2xl">{t('invalidInvite') || 'Invalid Invitation'}</CardTitle>
            <CardDescription>
              {inviteData.expired 
                ? t('inviteExpired') || 'This invitation has expired.'
                : inviteData.error || t('inviteError') || 'There was an error with this invitation.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('error') || 'Error'}</AlertTitle>
              <AlertDescription>
                {inviteData.expired 
                  ? t('inviteExpiredDescription') || 'The invitation link has expired and is no longer valid.'
                  : inviteData.error || t('inviteErrorDescription') || 'The invitation link is invalid or has been removed.'}
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

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {t('joinGroup') || 'Join Group'}
          </CardTitle>
          <CardDescription>
            {inviteData.groupName 
              ? t('joinGroupDescription', { name: inviteData.groupName }) || `You've been invited to join ${inviteData.groupName}`
              : t('joinGroupGeneric') || 'You have been invited to join a group'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show usage info if available */}
          {inviteData.maxUses && (
            <div className="text-sm text-muted-foreground">
              {t('inviteUsageCount', { current: inviteData.usedCount || 0, max: inviteData.maxUses }) || 
                `This invitation has been used ${inviteData.usedCount || 0} of ${inviteData.maxUses} times.`}
            </div>
          )}

          {/* Show email input if required or not logged in */}
          {(requireEmail || status !== 'authenticated') && (
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={joining}
                required
              />
              <p className="text-sm text-muted-foreground">
                {status !== 'authenticated' 
                  ? t('emailNeededToJoin') || 'You need to enter your email to join this group'
                  : t('emailConfirmation') || 'Please confirm your email to join this group'}
              </p>
            </div>
          )}

          {status === 'authenticated' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{t('authenticated') || 'Authenticated'}</AlertTitle>
              <AlertDescription>
                {t('authenticatedDescription') || 'You are logged in and ready to join the group.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={handleJoinGroup}
            disabled={joining || (requireEmail && !email)}
          >
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('joining') || 'Joining...'}
              </>
            ) : (
              t('joinNow') || 'Join Now'
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/dashboard/groups')}
            disabled={joining}
          >
            {t('cancel')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 