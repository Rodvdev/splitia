'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  UserPlus, 
  MoreVertical,
  PieChart,
  Share2
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

// For a real implementation, fetch the group data from the API
// This is a placeholder for now
interface GroupMember {
  id: string;
  name: string;
  image?: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  members: GroupMember[];
}

export default function GroupPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  
  // Fetch group data when component mounts
  useEffect(() => {
    const loadGroup = async () => {
      setIsLoading(true);
      try {
        // Fetch the group data from the API
        const response = await fetch(`/api/groups/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch group data');
        }
        
        const data = await response.json();
        setGroup(data);
      } catch (error) {
        console.error('Failed to load group:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroup();
  }, [params.id]);

  // Navigate back
  const handleBack = () => {
    router.push('/dashboard/groups');
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Group settings
  const handleSettings = () => {
    router.push(`/dashboard/groups/${params.id}/settings`);
  };

  // Invite members
  const handleInvite = () => {
    router.push(`/dashboard/groups/${params.id}/invite`);
  };

  // Delete group
  const handleDelete = () => {
    if (confirm(t('deleteConfirm', { defaultValue: 'Are you sure you want to delete this group?' }))) {
      // Delete the group via API
      fetch(`/api/groups/${params.id}`, {
        method: 'DELETE',
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to delete group');
          router.push('/dashboard/groups');
        })
        .catch(error => {
          console.error('Error deleting group:', error);
          // Show error notification here if you have a notification system
        });
    }
  };

  // Leave group
  const handleLeave = () => {
    if (confirm(t('leaveConfirm', { defaultValue: 'Are you sure you want to leave this group?' }))) {
      // Leave the group via API
      fetch(`/api/groups/${params.id}/leave`, {
        method: 'POST',
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to leave group');
          router.push('/dashboard/groups');
        })
        .catch(error => {
          console.error('Error leaving group:', error);
          // Show error notification here if you have a notification system
        });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        
        <Skeleton className="h-10 w-full" />
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">{t('groupNotFound')}</h3>
        <Button className="mt-4" onClick={handleBack}>
          {t('backToGroups')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInvite}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('invite')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLeave} className="text-orange-600">
              <Share2 className="mr-2 h-4 w-4" />
              {t('leave')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Settings className="mr-2 h-4 w-4" />
              {t('delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-start gap-4 mb-6">
        <div className="h-20 w-20 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-3xl">
          {group.image ? (
            <Image src={group.image} alt={group.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            getInitials(group.name)
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && (
            <p className="text-muted-foreground mt-1">{group.description}</p>
          )}
          <div className="flex items-center mt-2">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t('membersCount', { count: group.members.length })}
            </span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="members">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            {t('members')}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">
            <PieChart className="h-4 w-4 mr-2" />
            {t('expenses')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>{t('members')}</CardTitle>
                <Button onClick={handleInvite} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('invite')}
                </Button>
              </div>
              <CardDescription>
                {t('membersDescription', { defaultValue: 'People who can view and add expenses to this group' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {group.members.map(member => (
                  <li key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.image} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'ADMIN' ? 'default' : 'outline'}>
                      {member.role === 'ADMIN' ? t('admin') : t('member')}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('expenses')}</CardTitle>
              <CardDescription>
                {t('expensesDescription', { defaultValue: 'All expenses associated with this group' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {t('noExpenses', { defaultValue: 'No expenses added to this group yet' })}
                </p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/expenses/create')}>
                  {t('addExpense')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 