'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Users, Search, Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// GraphQL functions
import { createConversation, createGroupChat } from '@/lib/chat-graphql';

// Simple user interface
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function CreateChatPage() {
  const t = useTranslations('chat');
  const router = useRouter();
  const { data: session } = useSession();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupChatMode, setGroupChatMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // In a real app, you would fetch users from the API
        // For now, we'll simulate it with a timeout
        setTimeout(() => {
          const mockUsers: User[] = [
            { id: '1', name: 'Alice Smith', email: 'alice@example.com' },
            { id: '2', name: 'Bob Johnson', email: 'bob@example.com' },
            { id: '3', name: 'Charlie Davis', email: 'charlie@example.com' },
            { id: '4', name: 'Diana White', email: 'diana@example.com' },
            { id: '5', name: 'Edward Brown', email: 'edward@example.com' },
          ];
          
          // Filter out the current user
          const filteredUsers = mockUsers.filter(user => 
            user.id !== session?.user?.id
          );
          
          setUsers(filteredUsers);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching users:', error);
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchUsers();
    }
  }, [session?.user]);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle user selection
  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(selected => selected.id === user.id)) {
      setSelectedUsers(prev => prev.filter(selected => selected.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Remove a selected user
  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Generate avatar fallback from name
  const getAvatarFallback = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Create conversation or group chat
  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error(t('selectAtLeastOne'));
      return;
    }

    if (groupChatMode && !groupName.trim()) {
      toast.error(t('groupNameRequired'));
      return;
    }

    try {
      setIsCreating(true);
      
      // Get selected user IDs
      const participantIds = selectedUsers.map(user => user.id);
      
      if (groupChatMode) {
        // Create a group chat
        const result = await createGroupChat(groupName, participantIds);
        router.push(`/dashboard/chat?id=${result.id}`);
      } else {
        // Create a direct conversation (we only support one-to-one for now)
        if (participantIds.length > 1) {
          toast.error(t('directChatLimit'));
          setIsCreating(false);
          return;
        }
        
        const result = await createConversation(participantIds);
        router.push(`/dashboard/chat?id=${result.id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error(t('errorCreatingChat'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-full p-4">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{t('createChat')}</h1>
        </div>
        
        {/* Group Chat Toggle */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <Label htmlFor="group-chat-toggle">{t('createGroupChat')}</Label>
          </div>
          <Switch
            id="group-chat-toggle"
            checked={groupChatMode}
            onCheckedChange={setGroupChatMode}
          />
        </div>
        
        {/* Group Name Input (if group chat mode) */}
        {groupChatMode && (
          <div className="mb-4">
            <Label htmlFor="group-name" className="mb-2 block">
              {t('groupName')}
            </Label>
            <Input
              id="group-name"
              placeholder={t('groupNamePlaceholder')}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-4"
            />
          </div>
        )}
        
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <Label className="mb-2 block">
              {groupChatMode ? t('groupMembers') : t('selectedContact')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary" className="gap-1 px-2 py-1">
                  <span>{user.name}</span>
                  <button
                    onClick={() => removeSelectedUser(user.id)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* User Search */}
        <div className="mb-4 relative">
          <Label htmlFor="user-search" className="mb-2 block">
            {t('searchContacts')}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-search"
              placeholder={t('searchContactsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* User List */}
        <ScrollArea className="flex-1 border rounded-md">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="p-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedUsers.some(selected => selected.id === user.id) ? 'bg-accent' : ''
                  }`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <Avatar>
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback>
                      {getAvatarFallback(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
              <p>{t('noUsersFound')}</p>
            </div>
          )}
        </ScrollArea>
        
        {/* Create Button */}
        <div className="mt-6">
          <Button 
            onClick={handleCreateChat} 
            disabled={selectedUsers.length === 0 || isCreating || (groupChatMode && !groupName.trim())}
            className="w-full"
          >
            {isCreating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {t('creating')}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                {groupChatMode ? t('createGroup') : t('startChat')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 