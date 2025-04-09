'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Link, Copy, QrCode } from 'lucide-react';

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
        maxUses?: number; 
        expiresAt?: string; 
      } = { groupId };
      
      if (useLimitEnabled && values.maxUses) {
        variables.maxUses = values.maxUses;
      }
      
      if (expiryEnabled && values.expiryTime && values.expiryUnit) {
        // Calculate expiry date
        const now = new Date();
        if (values.expiryUnit === 'hours') {
          now.setHours(now.getHours() + values.expiryTime);
        } else {
          now.setDate(now.getDate() + values.expiryTime);
        }
        variables.expiresAt = now.toISOString();
      }
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation GenerateInviteLink($groupId: ID!, $maxUses: Int, $expiresAt: String) {
              generateGroupInviteLink(data: {
                groupId: $groupId,
                maxUses: $maxUses,
                expiresAt: $expiresAt
              }) {
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
      
      const linkUrl = result.data?.generateGroupInviteLink?.url || 
        `${window.location.origin}/join?token=${result.data?.generateGroupInviteLink?.token}`;
      
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
    toast.success(t('linkCopied'));
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
                          className="rounded-l-none"
                          variant="secondary"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {t('copyLink')}
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
    </div>
  );
} 