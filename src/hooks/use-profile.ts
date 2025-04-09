'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Interface for user profile data
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  currency: string;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for profile update data
export interface ProfileUpdateData {
  name?: string;
  currency?: string;
  language?: string;
  image?: string;
}

export function useProfile() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = async () => {
    if (!isAuthenticated) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile/get');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      setProfile(data.user);
      return data.user;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updateData: ProfileUpdateData) => {
    if (!isAuthenticated) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }
      
      setProfile(data.user);
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile data on mount and when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
  };
} 