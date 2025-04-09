'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  currency: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!session || status !== 'authenticated') {
          setError('Not authenticated');
          return;
        }
        
        // Fetch user profile from API
        const response = await fetch('/api/profile/get', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        if (data.user) {
          setProfile(data.user);
        } else {
          throw new Error('User not found');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [session, status]);

  return { profile, isLoading, error };
} 