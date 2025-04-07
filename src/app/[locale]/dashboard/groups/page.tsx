'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Users, 
  UserPlus, 
  Settings 
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserGroups } from '@/lib/graphql-client';
import Image from 'next/image';

// Interface for groups data
interface Group {
  id: string;
  name: string;
  image?: string | null;
  description?: string | null;
}

// Type for the API response
interface UserGroupsResponse {
  userGroups: Group[];
}

export default function GroupsPage() {
  const t = useTranslations('groups');
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user groups when component mounts
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const response = await fetchUserGroups() as UserGroupsResponse;
        setGroups(response.userGroups || []);
      } catch (error: unknown) {
        console.error('Failed to fetch groups:', error);
        
        // Check if it's an authentication error
        const err = error as { 
          message?: string; 
          response?: { 
            errors?: Array<{ 
              extensions?: { 
                code?: string 
              } 
            }> 
          } 
        };
        
        if (err.message?.includes('Not authenticated') || 
            err.response?.errors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
          // Handle auth error - could redirect to login or show a specific message
          console.error('Authentication error when fetching groups');
          // Could redirect to login page if needed
          // router.push('/sign-in');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGroups();
  }, []);

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Navigate to create group page
  const handleCreateGroup = () => {
    router.push('/dashboard/groups/create');
  };

  // Navigate to view group page
  const handleViewGroup = (groupId: string) => {
    router.push(`/dashboard/groups/${groupId}`);
  };

  // Generate placeholder image when no image is available
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search')}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewGroup(group.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {group.image ? (
                    <Image 
                      src={group.image} 
                      alt={group.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {getInitials(group.name)}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                  </div>
                </div>
                {group.description && (
                  <CardDescription className="mt-2">{group.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-1 h-4 w-4" />
                  <span>{t('membersCount', { count: 3 })}</span> {/* This should be dynamically populated from the API */}
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/groups/${group.id}`);
                  }}
                >
                  <Settings className="mr-1 h-4 w-4" />
                  {t('manage')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/groups/${group.id}/invite`);
                  }}
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  {t('invite')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('noGroups')}</h3>
          <p className="mt-2 text-muted-foreground">
            {t('noGroupsDescription')}
          </p>
          <Button className="mt-4" onClick={handleCreateGroup}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>
        </div>
      )}
    </div>
  );
} 