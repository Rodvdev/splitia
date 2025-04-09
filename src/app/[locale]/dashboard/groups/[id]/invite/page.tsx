'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Link, Copy, QrCode, Share2, Check } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Switch } from "@/components/ui/switch";

export default function InviteToGroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const params = useParams();
  const groupId = params?.id as string;
  
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [useLimitEnabled, setUseLimitEnabled] = useState(false);
  const [expiryEnabled, setExpiryEnabled] = useState(false);
  const [requireEmailEnabled, setRequireEmailEnabled] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form schema for email invitations
  const emailFormSchema = z.object({
    email: z.string().email(t('invalidEmail')),
    role: z.enum(['ADMIN', 'MEMBER', 'GUEST', 'ASSISTANT']),
  });

  // Form schema for link invitations
  const linkFormSchema = z.object({
    maxUses: z.number().optional(),
    expiryTime: z.number().optional(),
    expiryUnit: z.enum(['hours', 'days']).optional(),
  });
  
  // Initialize forms
  const emailForm = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });
  
  const linkForm = useForm<z.infer<typeof linkFormSchema>>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      maxUses: 5,
      expiryTime: 24,
      expiryUnit: 'hours',
    },
  });

  // Handle email invitation
  const handleSendInvite = async (values: z.infer<typeof emailFormSchema>) => {
    setIsSending(true);
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation AddGroupMember($groupId: ID!, $data: GroupMemberInput!) {
              addGroupMember(groupId: $groupId, data: $data)
            }
          `,
          variables: {
            groupId,
            data: {
              email: values.email,
              role: values.role,
            },
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      toast.success(t('inviteSent'));
      emailForm.reset();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(t('inviteError'));
    } finally {
      setIsSending(false);
    }
  };

  // Generate invite link
  const handleGenerateLink = async (values: z.infer<typeof linkFormSchema>) => {
    setIsGenerating(true);
    
    try {
      const variables: { 
        groupId: string; 
        data: {
          maxUses?: number; 
          expiresAt?: string;
          requireEmail?: boolean;
        }
      } = { 
        groupId,
        data: {}
      };
      
      if (useLimitEnabled && values.maxUses) {
        variables.data.maxUses = values.maxUses;
      }
      
      if (expiryEnabled && values.expiryTime && values.expiryUnit) {
        // Calculate expiry date
        const now = new Date();
        if (values.expiryUnit === 'hours') {
          now.setHours(now.getHours() + values.expiryTime);
        } else {
          now.setDate(now.getDate() + values.expiryTime);
        }
        variables.data.expiresAt = now.toISOString();
      }
      
      if (requireEmailEnabled) {
        variables.data.requireEmail = true;
      }
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateGroupInvitation($groupId: ID!, $data: GroupInvitationInput!) {
              createGroupInvitation(groupId: $groupId, data: $data) {
                token
                url
              }
            }
          `,
          variables,
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      const linkUrl = result.data?.createGroupInvitation?.url || 
        `${window.location.origin}/join?token=${result.data?.createGroupInvitation?.token}`;
      
      setInviteLink(linkUrl);
      toast.success(t('linkGenerated'));
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error(t('linkError'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('linkCopied'));
  };

  // Share link using Web Share API or show share dialog
  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('inviteLink'),
          text: t('inviteText') || 'Join my group in Splitia!',
          url: inviteLink,
        });
      } catch (error) {
        console.error('Error sharing link:', error);
        setShowShareDialog(true);
      }
    } else {
      setShowShareDialog(true);
    }
  };

  // Go back to group details
  const handleBack = () => {
    router.push(`/dashboard/groups/${groupId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={handleBack} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back')}
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('invite')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                {t('inviteByEmail')}
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="h-4 w-4 mr-2" />
                {t('inviteByLink')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="mt-4">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleSendInvite)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('email')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="email@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t('emailDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={emailForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selectRole')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('selectRole')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                            <SelectItem value="MEMBER">{t('member')}</SelectItem>
                            <SelectItem value="GUEST">{t('guest')}</SelectItem>
                            <SelectItem value="ASSISTANT">{t('roles.assistant')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('roleDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSending}
                  >
                    {isSending ? t('sending') : t('sendInvite')}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="link" className="mt-4">
              <Form {...linkForm}>
                <form onSubmit={linkForm.handleSubmit(handleGenerateLink)} className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('limitUses')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('limitUsesDescription')}
                        </p>
                      </div>
                      <Switch 
                        checked={useLimitEnabled}
                        onCheckedChange={setUseLimitEnabled}
                      />
                    </div>
                    
                    {useLimitEnabled && (
                      <FormField
                        control={linkForm.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('maxUses')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('useExpiry')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('useExpiryDescription')}
                        </p>
                      </div>
                      <Switch 
                        checked={expiryEnabled}
                        onCheckedChange={setExpiryEnabled}
                      />
                    </div>
                    
                    {expiryEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={linkForm.control}
                          name="expiryTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('expires')}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={linkForm.control}
                          name="expiryUnit"
                          render={({ field }) => (
                            <FormItem className="pt-6">
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="hours">{t('hours')}</SelectItem>
                                  <SelectItem value="days">{t('days')}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('requireEmail') || "Require Email Registration"}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('requireEmailDescription') || "Invitees will be required to enter their email to join and create an account"}
                        </p>
                      </div>
                      <Switch 
                        checked={requireEmailEnabled}
                        onCheckedChange={setRequireEmailEnabled}
                      />
                    </div>
                  </div>
                  
                  {!inviteLink ? (
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isGenerating}
                    >
                      {isGenerating ? t('generating') : t('generateLink')}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex">
                        <Input value={inviteLink} readOnly className="rounded-r-none" />
                        <Button 
                          type="button" 
                          onClick={handleCopyLink}
                          className="rounded-l-none rounded-r-none border-x-0"
                          variant="secondary"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-1" />
                          ) : (
                            <Copy className="h-4 w-4 mr-1" />
                          )}
                          {copied ? t('copied') || 'Copied!' : t('copyLink')}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleShareLink}
                          className="rounded-l-none"
                          variant="secondary"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          {t('share') || 'Share'}
                        </Button>
                      </div>
                      
                      <div className="flex justify-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setInviteLink('')}
                        >
                          {t('generateNew')}
                        </Button>
                      </div>
                      
                      <div className="flex justify-center mt-4">
                        <div className="bg-white p-4 rounded-lg">
                          <QrCode className="h-32 w-32 text-primary" />
                          <p className="text-center text-xs mt-2 text-muted-foreground">{t('qrCode')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('shareInviteLink') || 'Share Invitation Link'}</DialogTitle>
            <DialogDescription>
              {t('shareDescription') || 'Share this link with anyone you want to invite to your group'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    handleCopyLink();
                    setShowShareDialog(false);
                  }}
                  className="flex flex-col h-auto py-4 gap-2"
                  variant="outline"
                >
                  <Copy className="h-5 w-5" />
                  <span>{t('copy') || 'Copy'}</span>
                </Button>
                
                <Button
                  onClick={() => {
                    const url = `mailto:?subject=${encodeURIComponent(t('inviteEmailSubject') || 'Invitation to join my group')}&body=${encodeURIComponent(inviteLink)}`;
                    window.open(url, '_blank');
                    setShowShareDialog(false);
                  }}
                  className="flex flex-col h-auto py-4 gap-2"
                  variant="outline"
                >
                  <Mail className="h-5 w-5" />
                  <span>{t('email') || 'Email'}</span>
                </Button>
                
                <Button
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(`${t('inviteWhatsAppText') || 'Join my group using this link:'} ${inviteLink}`)}`;
                    window.open(url, '_blank');
                    setShowShareDialog(false);
                  }}
                  className="flex flex-col h-auto py-4 gap-2"
                  variant="outline"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.6 6.3C16.2 4.9 14.2 4 12.1 4C7.9 4 4.6 7.3 4.6 11.5C4.6 13.1 5 14.6 5.8 16L4.5 20L8.6 18.7C10 19.4 11.1 19.8 12.2 19.8C16.4 19.8 19.7 16.5 19.7 12.3C19.6 10.2 18.9 8.2 17.6 6.3M12.1 18.3C11.1 18.3 10.1 18 9.2 17.4L9 17.3L6.5 18.1L7.3 15.7L7.1 15.5C6.4 14.5 6.1 13.5 6.1 12.4C6.1 8.1 8.8 5.4 13.1 5.4C14.9 5.4 16.6 6.1 17.7 7.3C18.9 8.5 19.6 10.1 19.6 11.9C19.4 15.3 16.8 18.3 12.1 18.3M16.2 13.4C16 13.3 14.8 12.7 14.6 12.6C14.4 12.5 14.3 12.5 14.1 12.7C14 12.9 13.5 13.5 13.4 13.6C13.3 13.7 13.1 13.8 12.9 13.6C11.9 13.1 11.2 12.7 10.5 11.6C10.3 11.3 10.6 11.3 10.9 10.7C11 10.6 10.9 10.5 10.9 10.4C10.8 10.3 10.5 9.1 10.3 8.7C10.1 8.1 9.9 8.2 9.8 8.2C9.7 8.2 9.5 8.2 9.4 8.2C9.2 8.2 9 8.3 8.8 8.5C8.6 8.7 8 9.3 8 10.5C8 11.7 8.8 12.9 8.9 13C9 13.1 10.5 15.4 12.8 16.5C14.1 17.1 14.7 17.1 15.4 17C15.9 17 16.9 16.5 17.1 16C17.3 15.5 17.3 15.1 17.2 15C17.2 14.9 17.1 14.9 16.2 13.4Z" />
                  </svg>
                  <span>WhatsApp</span>
                </Button>
                
                <Button
                  onClick={() => {
                    const url = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(t('inviteTelegramText') || 'Join my group using this link:')}`;
                    window.open(url, '_blank');
                    setShowShareDialog(false);
                  }}
                  className="flex flex-col h-auto py-4 gap-2"
                  variant="outline"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.22 15.51 15.99C15.37 16.74 15.09 16.99 14.83 17.02C14.25 17.09 13.81 16.66 13.25 16.29C12.37 15.72 11.87 15.37 11.02 14.82C10.03 14.19 10.67 13.85 11.24 13.26C11.39 13.1 13.95 10.8 14 10.57C14.0069 10.5355 14.0069 10.4997 14 10.465C13.9807 10.4313 13.9521 10.4039 13.917 10.386C13.85 10.36 13.76 10.38 13.68 10.39C13.58 10.4 12.42 11.16 10.21 12.67C9.77 12.97 9.37 13.12 9 13.1C8.58 13.08 7.79 12.85 7.2 12.66C6.46 12.43 5.87 12.3 5.93 11.9C5.96 11.69 6.25 11.48 6.8 11.26C9.18 10.19 10.83 9.46 11.76 9.08C14.28 7.98 14.83 7.79 15.2 7.78C15.29 7.78 15.5 7.8 15.63 7.92C15.71 8 15.75 8.12 15.76 8.2C15.77 8.27 15.78 8.43 15.77 8.55C15.63 8.93 16.64 8.8 16.64 8.8Z" />
                  </svg>
                  <span>Telegram</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 