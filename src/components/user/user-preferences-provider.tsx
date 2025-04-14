'use client';

import React, { ReactNode, createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Define los tipos para las preferencias del usuario
export interface UserPreferences {
  currency: string;
  language: string;
  theme?: string;
  // Se pueden agregar más preferencias según sea necesario
}

// Define el tipo para el contexto
interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
}

// Valores por defecto
const defaultPreferences: UserPreferences = {
  currency: 'USD',
  language: 'es',
  theme: 'light'
};

// Crear el contexto
const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  isLoading: true,
  error: null,
  updatePreferences: async () => false,
});

// Hook para usar el contexto
export const useUserPreferences = () => useContext(UserPreferencesContext);

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evitar re-cargar las preferencias si ya las tenemos
  const initializedRef = useRef(false);

  // Cargar las preferencias del usuario al montar el componente
  useEffect(() => {
    // Si ya inicializamos o no hay autenticación, no hacer nada
    if (initializedRef.current || !isAuthenticated) {
      if (!isAuthenticated) {
        setIsLoading(false);
      }
      return;
    }

    const fetchUserPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Llamar a la API para obtener las preferencias del usuario
        const response = await fetch('/api/profile/get');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user preferences');
        }
        
        const data = await response.json();
        
        if (data.user) {
          // Actualizar el estado con las preferencias del usuario
          setPreferences({
            currency: data.user.currency || defaultPreferences.currency,
            language: data.user.language || defaultPreferences.language,
            theme: data.user.theme || defaultPreferences.theme
          });
          
          // También almacenar en localStorage para acceso rápido
          localStorage.setItem('userPreferredCurrency', data.user.currency || defaultPreferences.currency);
          localStorage.setItem('userPreferredLanguage', data.user.language || defaultPreferences.language);
          
          // Marcar como inicializado
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        
        // Intentar cargar desde localStorage si la API falla
        const storedCurrency = localStorage.getItem('userPreferredCurrency');
        const storedLanguage = localStorage.getItem('userPreferredLanguage');
        
        if (storedCurrency || storedLanguage) {
          setPreferences({
            ...preferences,
            currency: storedCurrency || preferences.currency,
            language: storedLanguage || preferences.language
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPreferences();
  }, [isAuthenticated, preferences]);

  // Función para actualizar las preferencias del usuario
  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Llamar a la API para actualizar las preferencias
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user preferences');
      }
      
      const data = await response.json();
      
      if (data.user) {
        // Actualizar el estado local
        setPreferences(prev => ({
          ...prev,
          ...newPreferences
        }));
        
        // Actualizar localStorage
        if (newPreferences.currency) {
          localStorage.setItem('userPreferredCurrency', newPreferences.currency);
        }
        if (newPreferences.language) {
          localStorage.setItem('userPreferredLanguage', newPreferences.language);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        error,
        updatePreferences
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
} 