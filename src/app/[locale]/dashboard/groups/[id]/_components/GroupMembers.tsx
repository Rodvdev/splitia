'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, UserCog, UserMinus } from 'lucide-react';

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from 'sonner';

interface GroupMember {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: string;
}

interface GroupMembersProps {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
  onMemberRemoved: (memberId: string) => void;
  onRoleChanged: (memberId: string, newRole: string) => void;
}

export function GroupMembers({
  members,
  currentUserId,
  onMemberRemoved,
  onRoleChanged
}: GroupMembersProps) {
  const t = useTranslations('groups');
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Get the user's initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Check if the current user has admin privileges
  const isAdmin = members.some(member => member.role === 'ADMIN');

  // Check if the user can be managed (not the current user and has admin rights)
  const canManageMember = (member: GroupMember) => {
    if (member.id === currentUserId) return false;
    if (!isAdmin) return false;
    return true;
  };

  // Handle member removal
  const handleRemoveMember = async () => {
    if (!memberToRemove || !onMemberRemoved) return;

    setIsRemoving(true);
    try {
      await onMemberRemoved(memberToRemove.id);
      toast.success(t('memberRemoved', { name: memberToRemove.name }));
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(t('errors.removeMemberFailed'));
    } finally {
      setIsRemoving(false);
      setMemberToRemove(null);
    }
  };

  // Handle role change
  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!onRoleChanged) return;

    try {
      await onRoleChanged(memberId, newRole);
      toast.success(t('roleUpdated'));
    } catch (error) {
      console.error('Failed to change role:', error);
      toast.error(t('errors.roleChangeFailed'));
    }
  };

  // Role labels mapping
  const roleLabels: Record<string, string> = {
    ADMIN: t('roles.admin'),
    MEMBER: t('roles.member'),
    GUEST: t('roles.guest'),
    ASSISTANT: t('roles.assistant')
  };

  // Role badge variants - using types supported by Badge component
  const roleBadgeVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    ADMIN: "default",
    MEMBER: "secondary",
    GUEST: "outline",
    ASSISTANT: "destructive"
  };

  return (
    <div>
      <CardHeader>
        <CardTitle>{t('members')}</CardTitle>
        <CardDescription>
          {t('membersDescription', { count: members.length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {t('noMembers')}
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    {member.image ? (
                      <AvatarImage src={member.image} alt={member.name} />
                    ) : (
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {member.name}
                      {member.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">
                          {t('you')}
                        </Badge>
                      )}
                    </div>
                    {member.email && (
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={roleBadgeVariants[member.role] || "default"}>
                    {roleLabels[member.role] || member.role}
                  </Badge>

                  {canManageMember(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions.openMenu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer"
                          onClick={() => handleChangeRole(member.id, 'ADMIN')}
                          disabled={member.role === 'ADMIN'}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('actions.makeAdmin')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer"
                          onClick={() => handleChangeRole(member.id, 'MEMBER')}
                          disabled={member.role === 'MEMBER'}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('actions.makeMember')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer"
                          onClick={() => handleChangeRole(member.id, 'GUEST')}
                          disabled={member.role === 'GUEST'}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('actions.makeGuest')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center cursor-pointer"
                          onClick={() => handleChangeRole(member.id, 'ASSISTANT')}
                          disabled={member.role === 'ASSISTANT'}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          {t('actions.makeAssistant')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="flex items-center cursor-pointer text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setMemberToRemove(member);
                              }}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              {t('actions.remove')}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('removeConfirmTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('removeConfirmDescription', { name: member.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleRemoveMember}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={isRemoving}
                              >
                                {isRemoving ? t('actions.removing') : t('actions.remove')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </div>
  );
} 