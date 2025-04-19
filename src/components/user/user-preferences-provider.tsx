'use client';

import React, { ReactNode, createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Define ThemeMode enum to match Prisma's enum
enum ThemeMode {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM'
}

// Define los tipos para las preferencias del usuario
export interface UserPreferences {
  currency: string;
  language: string;
  theme: ThemeMode;
  // Se pueden agregar más preferencias según sea necesario
}

// Define el tipo para el contexto
interface UserPreferencesContextType {
  preferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

// Valores por defecto
const defaultPreferences: UserPreferences = {
  currency: 'USD',
  language: 'es',
  theme: ThemeMode.SYSTEM
};

// Crear el contexto
const UserPreferencesContext = createContext<UserPreferencesContextType>({
  preferences: defaultPreferences,
  isLoading: true,
  error: null,
  updatePreferences: async () => false,
  theme: ThemeMode.SYSTEM,
  setTheme: () => {}
});

// Hook para usar el contexto
export const useUserPreferences = () => useContext(UserPreferencesContext);

// Provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.SYSTEM);

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
          console.error(`Failed to fetch preferences: ${response.status} ${response.statusText}`);
          // Load from localStorage instead of throwing an error
          loadFromLocalStorage();
          return;
        }
        
        const data = await response.json();
        
        if (data.user) {
          // Get theme from user preferences
          const userTheme = data.user.preferences?.theme;
          if (userTheme && Object.values(ThemeMode).includes(userTheme as ThemeMode)) {
            setTheme(userTheme as ThemeMode);
          }
          
          // Actualizar el estado con las preferencias del usuario
          setPreferences({
            currency: data.user.currency || defaultPreferences.currency,
            language: data.user.language || defaultPreferences.language,
            theme: userTheme || defaultPreferences.theme
          });
          
          // También almacenar en localStorage para acceso rápido
          localStorage.setItem('userPreferredCurrency', data.user.currency || defaultPreferences.currency);
          localStorage.setItem('userPreferredLanguage', data.user.language || defaultPreferences.language);
          localStorage.setItem('theme', userTheme || defaultPreferences.theme);
          
          // Marcar como inicializado
          initializedRef.current = true;
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        
        // Intentar cargar desde localStorage si la API falla
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPreferences();
  }, [isAuthenticated]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Helper function to load from localStorage
  const loadFromLocalStorage = () => {
    const storedCurrency = localStorage.getItem('userPreferredCurrency');
    const storedLanguage = localStorage.getItem('userPreferredLanguage');
    const storedTheme = localStorage.getItem('theme');
    
    if (storedCurrency || storedLanguage || storedTheme) {
      // Update theme if available
      if (storedTheme && Object.values(ThemeMode).includes(storedTheme as ThemeMode)) {
        setTheme(storedTheme as ThemeMode);
      }
      
      setPreferences({
        ...preferences,
        currency: storedCurrency || preferences.currency,
        language: storedLanguage || preferences.language,
        theme: (storedTheme as ThemeMode) || preferences.theme
      });
    }
  };

  // Función para actualizar las preferencias del usuario
  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // If theme is changing, update it locally first for immediate feedback
      if (newPreferences.theme) {
        setTheme(newPreferences.theme);
      }
      
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
        if (newPreferences.theme) {
          localStorage.setItem('theme', newPreferences.theme);
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
  
  // Handle theme change
  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    
    // Update preferences if authenticated
    if (isAuthenticated) {
      updatePreferences({ theme: newTheme });
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        error,
        updatePreferences,
        theme,
        setTheme: handleThemeChange
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
} 