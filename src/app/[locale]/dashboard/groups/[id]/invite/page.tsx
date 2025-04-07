'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Copy, Mail } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Import GraphQL client functions
import { inviteToGroup, generateBasicGroupInviteLink } from '@/lib/graphql-client';

// Define form schema for email invitation
const emailInviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST']),
});

// Define form schema for link invitation
const linkInviteSchema = z.object({
  useLimit: z.boolean(),
  maxUses: z.coerce.number().min(1).optional(),
  useExpiry: z.boolean(),
  expiresAt: z.coerce.number().min(1).optional(),
  expiresUnit: z.enum(['hours', 'days']),
});

// Define the form values types
type EmailInviteFormValues = z.infer<typeof emailInviteSchema>;
type LinkInviteFormValues = z.infer<typeof linkInviteSchema>;

// Interfaces for GraphQL responses
interface GroupInviteLinkResponse {
  generateGroupInviteLink: {
    id: string;
    token: string;
    url: string;
    maxUses?: number;
    usedCount: number;
    expiresAt?: string;
  };
}

// Define error type for GraphQL errors
interface GraphQLError {
  message?: string;
  response?: {
    errors?: Array<{
      message?: string;
      extensions?: {
        code?: string;
      };
    }>;
  };
}

export default function InviteGroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const params = useParams();
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // Initialize email invite form
  const emailForm = useForm<EmailInviteFormValues>({
    resolver: zodResolver(emailInviteSchema),
    defaultValues: {
      email: '',
      role: 'MEMBER',
    },
  });

  // Initialize link invite form
  const linkForm = useForm<LinkInviteFormValues>({
    resolver: zodResolver(linkInviteSchema),
    defaultValues: {
      useLimit: false,
      maxUses: 5,
      useExpiry: false,
      expiresAt: 7,
      expiresUnit: 'days',
    },
  });

  // Watch the form fields for conditional rendering
  const useLimit = linkForm.watch('useLimit');
  const useExpiry = linkForm.watch('useExpiry');

  // Navigate back
  const handleBack = () => {
    router.push(`/dashboard/groups/${params?.id}`);
  };

  // Handle email invite form submission
  const onEmailSubmit = async (data: EmailInviteFormValues) => {
    setIsSubmittingEmail(true);
    
    try {
      // Call the GraphQL mutation to send the invitation
      const groupId = params?.id as string;
      await inviteToGroup({
        groupId,
        email: data.email,
        role: data.role,
      });
      
      toast.success(t.raw('inviteSent') || 'Invitation sent successfully');
      emailForm.reset();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error(t.raw('inviteError') || 'Failed to send invitation');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Handle link generation
  const onGenerateLink = async () => {
    setIsGeneratingLink(true);
    
    try {
      // Use only the basic invite link generation to avoid issues
      const groupId = params?.id as string;
      const response = await generateBasicGroupInviteLink(groupId) as GroupInviteLinkResponse;
      
      // Set the generated invite link
      setInviteLink(response.generateGroupInviteLink.url);
      
      toast.success(t.raw('linkGenerated') || 'Invitation link generated');
    } catch (error: unknown) {
      console.error('Failed to generate invitation link:', error);
      
      // Cast to GraphQLError type
      const graphqlError = error as GraphQLError;
      
      // Provide more specific error messaging based on the error
      const errorMessage = 
        graphqlError.response?.errors?.[0]?.message || 
        graphqlError.message || 
        t.raw('linkError') || 
        'Failed to generate invitation link';
        
      toast.error(errorMessage);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy invitation link to clipboard
  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success(t.raw('linkCopied') || 'Link copied to clipboard');
    }
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
          <Tabs defaultValue="email">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="email" className="flex-1">
                <Mail className="mr-2 h-4 w-4" />
                {t.raw('inviteByEmail') || 'Invite by Email'}
              </TabsTrigger>
              <TabsTrigger value="link" className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                {t.raw('inviteByLink') || 'Invite by Link'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email">
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('email')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="email@example.com" 
                            type="email" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t.raw('emailDescription') || 'Enter the email address of the person you want to invite'}
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
                        <FormLabel>{t('role')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.raw('selectRole') || 'Select a role'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                            <SelectItem value="MEMBER">{t('member')}</SelectItem>
                            <SelectItem value="GUEST">{t('guest')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t.raw('roleDescription') || 'The role determines what actions the user can perform'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmittingEmail}
                    >
                      {isSubmittingEmail ? t.raw('sending') || 'Sending...' : t.raw('sendInvite') || 'Send Invite'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="link">
              {inviteLink ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium break-all">{inviteLink}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setInviteLink(null)}
                    >
                      {t.raw('generateNew') || 'Generate New Link'}
                    </Button>
                    <Button onClick={handleBack}>
                      {t('done')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Form {...linkForm}>
                  <form onSubmit={linkForm.handleSubmit(onGenerateLink)} className="space-y-6">
                    <FormField
                      control={linkForm.control}
                      name="useLimit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t.raw('limitUses') || 'Limit Number of Uses'}
                            </FormLabel>
                            <FormDescription>
                              {t.raw('limitUsesDescription') || 'Limit how many times this invitation link can be used'}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {useLimit && (
                      <FormField
                        control={linkForm.control}
                        name="maxUses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.raw('maxUses') || 'Maximum Uses'}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={linkForm.control}
                      name="useExpiry"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Set Expiration Time
                            </FormLabel>
                            <FormDescription>
                              Make the invitation link expire after a certain time
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    {useExpiry && (
                      <div className="flex flex-col space-y-2">
                        <FormField
                          control={linkForm.control}
                          name="expiresAt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t.raw('expires') || 'Expires After'}</FormLabel>
                              <div className="flex space-x-2">
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    {...field} 
                                    className="w-20"
                                  />
                                </FormControl>
                                
                                <FormField
                                  control={linkForm.control}
                                  name="expiresUnit"
                                  render={({ field }) => (
                                    <Select 
                                      onValueChange={field.onChange} 
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-24">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="hours">{t('hours')}</SelectItem>
                                        <SelectItem value="days">{t('days')}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                              <FormDescription>
                                {t.raw('expiresDescription') || 'The link will expire after this time period'}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isGeneratingLink}
                      >
                        {isGeneratingLink ? t.raw('generating') || 'Generating...' : t.raw('generateLink') || 'Generate Link'}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 