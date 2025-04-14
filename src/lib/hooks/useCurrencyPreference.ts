'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';

interface CurrencyPreference {
  currency: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook personalizado para gestionar la preferencia de moneda del usuario
 * Intenta obtener la moneda del perfil del usuario, luego de localStorage, y finalmente usa un valor predeterminado
 */
export function useCurrencyPreference(defaultCurrency: string = 'USD'): CurrencyPreference {
  const { profile, isLoading: isProfileLoading, error: profileError } = useUserProfile();
  const [preference, setPreference] = useState<CurrencyPreference>({
    currency: defaultCurrency,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const getCurrencyPreference = async () => {
      try {
        // Si el perfil está cargado y tiene una moneda, úsala
        if (profile?.currency) {
          setPreference({
            currency: profile.currency,
            isLoading: false,
            error: null
          });
          // Guarda en localStorage para futuras referencias rápidas
          localStorage.setItem('userPreferredCurrency', profile.currency);
          return;
        }
        
        // Si el perfil está cargando, espera
        if (isProfileLoading) {
          return;
        }
        
        // Si hay un error en el perfil, intenta recuperar de localStorage
        if (profileError) {
          const storedCurrency = localStorage.getItem('userPreferredCurrency');
          if (storedCurrency) {
            setPreference({
              currency: storedCurrency,
              isLoading: false,
              error: null
            });
            return;
          }
        }
        
        // Si no hay moneda en el perfil, busca en localStorage
        const storedCurrency = localStorage.getItem('userPreferredCurrency');
        if (storedCurrency) {
          setPreference({
            currency: storedCurrency,
            isLoading: false,
            error: null
          });
          return;
        }
        
        // Si no hay nada, usa el valor predeterminado
        setPreference({
          currency: defaultCurrency,
          isLoading: false,
          error: null
        });
      } catch (err) {
        // En caso de error, usa el valor predeterminado
        setPreference({
          currency: defaultCurrency,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    };
    
    getCurrencyPreference();
  }, [profile, isProfileLoading, profileError, defaultCurrency]);

  return preference;
} 