'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Settings,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { fetchGroup, deleteGroup, changeGroupMemberRole, removeGroupMember } from '@/lib/graphql-client';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { GroupMembers } from './_components/GroupMembers';

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  members: GroupMember[];
}

export default function GroupPage() {
  // Get params directly using useParams hook
  const params = useParams();
  const groupId = params.id as string;
  
  const t = useTranslations('groups');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Fetch group data when component mounts
  useEffect(() => {
    const loadGroup = async () => {
      setIsLoading(true);
      try {
        // Use the GraphQL client to fetch the group
        const response = await fetchGroup(groupId);
        
        if (!response || !response.group) {
          throw new Error('Failed to fetch group data');
        }
        
        setGroup(response.group);
      } catch (error) {
        console.error('Failed to load group:', error);
        toast.error(t('errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroup();
  }, [groupId, t]);

  // Fetch current user ID when component mounts
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setCurrentUserId(data.user.id);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    
    getCurrentUser();
  }, []);

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
    router.push(`/dashboard/groups/${groupId}/settings`);
  };

  // Invite members
  const handleInvite = () => {
    router.push(`/dashboard/groups/${groupId}/invite`);
  };

  // Delete group
  const handleDelete = async () => {
    if (!group) return;
    
    setIsDeleting(true);
    try {
      await deleteGroup(group.id);
      toast.success(t('deleteSuccess'));
      router.push('/dashboard/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(t('errors.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle member role change
  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await changeGroupMemberRole({
        groupId,
        memberId,
        role: newRole as 'ADMIN' | 'MEMBER' | 'GUEST',
      });
      
      // Update the local state
      if (group) {
        setGroup({
          ...group,
          members: group.members.map(member => 
            member.id === memberId 
              ? { ...member, role: newRole } 
              : member
          ),
        });
      }
      
      toast.success(t('roleUpdateSuccess'));
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error(t('errors.roleUpdateFailed'));
    }
  };
  
  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeGroupMember({
        groupId,
        memberId,
      });
      
      // Update the local state
      if (group) {
        setGroup({
          ...group,
          members: group.members.filter(member => member.id !== memberId),
        });
      }
      
      toast.success(t('memberRemoveSuccess'));
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(t('errors.memberRemoveFailed'));
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="h-8 w-40 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-4 w-60 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-24 bg-muted animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-muted animate-pulse rounded"></div>
              <div className="h-12 bg-muted animate-pulse rounded"></div>
              <div className="h-12 bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state
  if (!group) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">{t('errors.notFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('errors.notFoundDescription')}</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.back')}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{t('view.title')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSettings}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('actions.settings')}
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleInvite}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t('actions.invite')}
          </Button>
        </div>
      </div>
      
      {/* Group info card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {group.image ? (
                <AvatarImage src={group.image} alt={group.name} />
              ) : null}
              <AvatarFallback className="text-lg">{getInitials(group.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="mt-1">{group.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{t('view.memberCount', { count: group.members.length })}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete group option */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('delete.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? t('actions.deleting') : t('actions.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Members section */}
      <GroupMembers
        members={group.members}
        currentUserRole={group.members.find(m => m.id === currentUserId)?.role || ''}
        currentUserId={currentUserId || ''}
        onChangeRole={handleChangeRole}
        onRemoveMember={handleRemoveMember}
      />
    </div>
  );
} 