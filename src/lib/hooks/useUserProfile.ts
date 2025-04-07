'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
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
  }, [supabase]);

  return { profile, isLoading, error };
} 