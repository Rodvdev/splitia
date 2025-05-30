import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface BalancePreviewProps {
  amount: number;
  currency: string;
  groupMembers: User[];
  paidById?: string;
  selectedMembers: string[];
  setSelectedMembers: React.Dispatch<React.SetStateAction<string[]>>;
  onCustomAmountsChange?: (amounts: Record<string, number>) => void;
}

export function ExpenseBalancePreview({ amount, currency, groupMembers, paidById, selectedMembers, setSelectedMembers, onCustomAmountsChange }: BalancePreviewProps) {
  const t = useTranslations('expenses.form.balancePreview');

  // State to track custom amounts for each member
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: number }>({});
  const [isCustomDivision, setIsCustomDivision] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(amount);
  
  // Calculate share per person
  const activeMembers = selectedMembers.length || 1; // Prevent division by zero
  const sharePerPerson = parseFloat((amount / activeMembers).toFixed(2));
  
  // Propagar cambios en customAmounts hacia arriba
  useEffect(() => {
    // Solo propagar cuando hay cambios significativos
    if (onCustomAmountsChange && isCustomDivision) {
      try {
        onCustomAmountsChange(customAmounts);
      } catch (error) {
        console.error("Error propagating custom amounts:", error);
      }
    }
  }, [customAmounts, isCustomDivision, onCustomAmountsChange]);

  // Reset to equal division
  const resetToEqual = useCallback(() => {
    try {
      const equalAmounts: { [key: string]: number } = {};
      const equalShare = parseFloat((amount / selectedMembers.length).toFixed(2));
      const totalWithEqual = parseFloat((equalShare * selectedMembers.length).toFixed(2));
      const correction = parseFloat((amount - totalWithEqual).toFixed(2));
      
      selectedMembers.forEach((id) => {
        equalAmounts[id] = equalShare;
      });
      
      if (correction !== 0 && selectedMembers.length > 0) {
        // Assign the remaining cent to the first member
        equalAmounts[selectedMembers[0]] += correction;
      }
      
      setCustomAmounts(equalAmounts);
      
      // Propagar este cambio inmediatamente
      if (onCustomAmountsChange) {
        onCustomAmountsChange(equalAmounts);
      }
    } catch (error) {
      console.error("Error in resetToEqual:", error);
    }
  }, [amount, selectedMembers, onCustomAmountsChange]);

  // Initialize the component with default equal division
  useEffect(() => {
    try {
      // Si no hay miembros, no hacer nada
      if (!selectedMembers.length) return;
      
      // Initialize custom amounts with equal shares when component mounts
      // or when key factors change (amount, members)
      resetToEqual();
      
      // Reset to equal division whenever these key factors change
    } catch (error) {
      console.error("Error initializing equal division:", error);
    }
  }, [amount, selectedMembers.length, resetToEqual]);

  // Initialize custom amounts when switching to custom mode
  useEffect(() => {
    if (isCustomDivision && selectedMembers.length > 0) {
      // Only set custom amounts if they're not already set
      const hasUnsetMembers = selectedMembers.some(id => customAmounts[id] === undefined);
      if (hasUnsetMembers) {
        resetToEqual();
      }
    }
  }, [isCustomDivision, customAmounts, resetToEqual, selectedMembers]);
  
  // Recalculate total allocated and remaining amount
  useEffect(() => {
    if (isCustomDivision && selectedMembers.length > 0) {
      try {
        const total = Object.entries(customAmounts)
          .filter(([id]) => selectedMembers.includes(id))
          .reduce((sum, [, amt]) => sum + amt, 0);
        setRemainingAmount(parseFloat((amount - total).toFixed(2)));
      } catch (error) {
        console.error("Error calculating remaining amount:", error);
        setRemainingAmount(0);
      }
    } else {
      setRemainingAmount(0); // No remaining amount in equal division
    }
  }, [customAmounts, selectedMembers, amount, isCustomDivision]);

  // Handle member selection
  const toggleMemberSelection = useCallback((memberId: string) => {
    try {
      // Copia en memoria los valores actuales para no depender de los estados anteriores
      let newSelected = [...selectedMembers];
      const isRemoving = newSelected.includes(memberId);
      const equalShare = selectedMembers.length > 0 
        ? parseFloat((amount / selectedMembers.length).toFixed(2)) 
        : 0;
      
      if (isRemoving) {
        // Si estamos quitando, filtramos el miembro
        newSelected = newSelected.filter(id => id !== memberId);
        // Actualizar en una sola operación
        setSelectedMembers(newSelected);
        
        // Actualizamos customAmounts en una operación separada
        setCustomAmounts(prev => {
          const updated = { ...prev };
          delete updated[memberId];
          return updated;
        });
      } else {
        // Si estamos añadiendo, añadimos el ID
        newSelected.push(memberId);
        // Actualizar en una sola operación
        setSelectedMembers(newSelected);
        
        // Actualizamos customAmounts en una operación separada
        setTimeout(() => {
          setCustomAmounts(prev => ({
            ...prev,
            [memberId]: equalShare
          }));
        }, 0);
      }
    } catch (error) {
      console.error("Error toggling member selection:", error);
    }
  }, [selectedMembers, amount]);

  // Handle custom amount change
  const handleCustomAmountChange = useCallback((memberId: string, value: string) => {
    const newAmount = parseFloat(value) || 0;
    
    // Update the custom amount for this member
    setCustomAmounts(prev => {
      const updated = { ...prev, [memberId]: newAmount };
      
      // Recalculate remaining amount immediately
      const totalAllocated = Object.entries(updated)
        .filter(([id]) => selectedMembers.includes(id))
        .reduce((sum, [, amt]) => sum + amt, 0);
      
      // Set the remaining amount
      setRemainingAmount(parseFloat((amount - totalAllocated).toFixed(2)));
      
      return updated;
    });
  }, [amount, selectedMembers]);

  // Distribute remaining amount equally among members
  const distributeRemaining = useCallback(() => {
    if (remainingAmount !== 0 && selectedMembers.length > 0) {
      const amountPerMember = remainingAmount / selectedMembers.length;
      setCustomAmounts(prev => {
        const updated = { ...prev };
        selectedMembers.forEach(id => {
          updated[id] = parseFloat(((updated[id] || 0) + amountPerMember).toFixed(2));
        });
        return updated;
      });
    }
  }, [remainingAmount, selectedMembers]);

  // Agregar opción para asignar todo a un solo miembro
  const assignAllToMember = useCallback((memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      // Crear una nueva distribución donde solo este miembro tiene el monto total
      const newCustomAmounts = { ...customAmounts };
      
      // Establecer a 0 los montos de todos los demás miembros seleccionados
      selectedMembers.forEach(id => {
        if (id !== memberId) {
          newCustomAmounts[id] = 0;
        }
      });
      
      // Asignar el monto total a este miembro
      newCustomAmounts[memberId] = amount;
      
      // Actualizar el estado
      setCustomAmounts(newCustomAmounts);
      
      // También establecer modo de división personalizada si no está activado
      if (!isCustomDivision) {
        setIsCustomDivision(true);
      }
      
      // Actualizar el monto restante
      setRemainingAmount(0);
      
      // Propagar este cambio inmediatamente
      if (onCustomAmountsChange) {
        onCustomAmountsChange(newCustomAmounts);
      }
    }
  }, [amount, customAmounts, isCustomDivision, onCustomAmountsChange, selectedMembers]);

  // Autocomplete the last member's amount
  const autocompleteLastMember = useCallback(() => {
    if (remainingAmount !== 0 && selectedMembers.length > 0) {
      // Find members with no custom amount set
      const membersWithoutAmount = selectedMembers.filter(
        id => customAmounts[id] === undefined || customAmounts[id] === 0
      );
      
      // If there's only one member without an amount, assign the remaining amount to them
      if (membersWithoutAmount.length === 1) {
        const lastMemberId = membersWithoutAmount[0];
        setCustomAmounts(prev => ({
          ...prev,
          [lastMemberId]: remainingAmount
        }));
      }
      // If all members have amounts but there's still remaining amount, add it to the first member
      else if (membersWithoutAmount.length === 0 && selectedMembers.length > 0) {
        const firstMemberId = selectedMembers[0];
        setCustomAmounts(prev => ({
          ...prev,
          [firstMemberId]: (prev[firstMemberId] || 0) + remainingAmount
        }));
      }
    }
  }, [remainingAmount, selectedMembers, customAmounts]);

  // Check if autocomplete should be shown
  const shouldShowAutocomplete = useCallback(() => {
    if (remainingAmount === 0 || !isCustomDivision) return false;
    
    // Count members with custom amounts set
    const membersWithCustomAmount = selectedMembers.filter(
      id => customAmounts[id] !== undefined && customAmounts[id] !== 0
    ).length;
    
    // Show autocomplete when all but one member have amounts set
    return membersWithCustomAmount >= selectedMembers.length - 1 && 
           selectedMembers.length > 0 && 
           remainingAmount !== 0;
  }, [remainingAmount, isCustomDivision, selectedMembers, customAmounts]);

  // Select or deselect all members
  const toggleAllMembers = useCallback(() => {
    let newSelected: string[];
    
    if (selectedMembers.length === groupMembers.length) {
      // Deselect all except payer
      newSelected = paidById ? [paidById] : [];
    } else {
      // Select all
      newSelected = groupMembers.map(m => m.id);
    }
    
    // Primero, actualizar los miembros seleccionados
    setSelectedMembers(newSelected);
    
    // Luego, actualizar los montos personalizados para que coincidan con los miembros seleccionados
    setTimeout(() => {
      setCustomAmounts(prev => {
        const updated = { ...prev };
        
        // Limpiamos los amounts para los miembros que ya no están seleccionados
        Object.keys(updated).forEach(id => {
          if (!newSelected.includes(id)) {
            delete updated[id];
          }
        });
        
        // Calculamos la parte igual para cada miembro seleccionado
        const equalShare = newSelected.length > 0 
          ? parseFloat((amount / newSelected.length).toFixed(2)) 
          : 0;
        
        // Agregamos amounts para los nuevos miembros seleccionados
        newSelected.forEach(id => {
          if (!updated[id]) {
            updated[id] = equalShare;
          }
        });
        
        return updated;
      });
    }, 0);
  }, [selectedMembers, groupMembers, paidById, amount]);

  // Calculate what each person owes/gets - use memoization to avoid recalculations
  const balances = useMemo(() => groupMembers.map(member => {
    if (!selectedMembers.includes(member.id)) {
      return { ...member, balance: 0 };
    }
    
    const customAmount = isCustomDivision && customAmounts[member.id] !== undefined 
      ? customAmounts[member.id] 
      : sharePerPerson;
      
    let balance = -customAmount; // By default, everyone owes their share
    
    // If this member paid, they get back everyone else's share
    if (member.id === paidById) {
      const totalOwedByOthers = selectedMembers.reduce((sum, id) => {
        if (id !== member.id) {
          return sum + (isCustomDivision && customAmounts[id] !== undefined 
            ? customAmounts[id] 
            : sharePerPerson);
        }
        return sum;
      }, 0);
      balance = amount - totalOwedByOthers; // They get the total minus what others owe
    }
    
    return {
      ...member,
      balance
    };
  }), [groupMembers, selectedMembers, isCustomDivision, customAmounts, sharePerPerson, paidById, amount]);

  // Check if this member should have autocomplete
  const shouldShowAutocompleteForMember = useCallback((memberId: string) => {
    // No llamar directamente a shouldShowAutocomplete, usar sus condiciones directamente
    if (remainingAmount === 0 || !isCustomDivision) return false;
    
    // Find members with no custom amount set or zero amount
    const membersWithoutAmount = selectedMembers.filter(
      id => customAmounts[id] === undefined || customAmounts[id] === 0
    );
    
    // If there's only one member without an amount, show autocomplete for it
    if (membersWithoutAmount.length === 1) {
      return membersWithoutAmount[0] === memberId;
    }
    
    // If all members have amounts but there's still remaining amount, 
    // show for the first member (where we'd add the remaining amount)
    if (membersWithoutAmount.length === 0 && selectedMembers.length > 0) {
      return selectedMembers[0] === memberId;
    }
    
    return false;
  }, [remainingAmount, isCustomDivision, selectedMembers, customAmounts]);

  return (
    <div className="mt-4 space-y-4">
      {/* Header section with title and mode toggle */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center px-1">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            {t('title')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help opacity-70" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs max-w-[220px]">{t('subtitle')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
        </div>
        
        <div className="flex items-center">
          <div className="bg-slate-50 dark:bg-slate-900 p-0.5 rounded-full shadow-sm flex items-center">
            <div
              onClick={() => setIsCustomDivision(false)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                !isCustomDivision 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t('equalDivision')}
            </div>
            <div
              onClick={() => setIsCustomDivision(true)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                isCustomDivision 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t('customDivision')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom division controls - only shown in custom mode */}
      {isCustomDivision && (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
          <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${
                remainingAmount !== 0 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {remainingAmount !== 0 
                  ? t('remainingToAllocate') 
                  : t('fullyAllocated')}:
                {' '}{remainingAmount.toFixed(2)} {currency}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3 w-3 text-muted-foreground opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">{t('remainingAmountTip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-2">
            <div
                onClick={resetToEqual} 
                className="px-2 py-1 text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors shadow-sm"
              >
                {t('resetEqual')}
              </div>
              {shouldShowAutocomplete() ? (
                <div 
                  onClick={autocompleteLastMember} 
                  className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors shadow-sm"
                >
                  {t('autocomplete')}
                </div>
              ) : remainingAmount !== 0 && (
                <div 
                  onClick={distributeRemaining} 
                  className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors shadow-sm"
                >
                  {t('distributeRemaining')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Group members list with balances */}
      <div className="bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm">
        {/* Members list header */}
        <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
          <div 
            onClick={toggleAllMembers}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {selectedMembers.length === groupMembers.length ? t('deselectAll') : t('selectAll')}
          </div>
          <div className="flex text-xs text-slate-500 dark:text-slate-400">
            <span className="mr-6 sm:mr-8">{t('amount')}</span>
            <span>{t('balance')}</span>
          </div>
        </div>
        
        {/* Members list */}
        <ScrollArea className="h-[200px] scrollbar-thin">
          <div className="px-4 divide-y divide-slate-100 dark:divide-slate-800/50">
            {balances.map((member) => (
              <div 
                key={member.id} 
                className={`py-2.5 flex items-center justify-between transition-colors ${
                  !selectedMembers.includes(member.id) ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`h-5 w-5 flex items-center justify-center rounded-full border ${
                      selectedMembers.includes(member.id) 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {selectedMembers.includes(member.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                  
                  <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarImage src={member.image || ''} />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {member.name?.charAt(0) || member.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="text-xs font-medium truncate max-w-[90px] sm:max-w-[120px]">
                      {member.name || member.email}
                      {member.id === paidById && (
                        <span className="ml-1.5 inline-flex items-center text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                          {t('paidTheBill')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  {isCustomDivision ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        value={customAmounts[member.id] !== undefined ? customAmounts[member.id] : sharePerPerson}
                        onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                        className={`w-16 sm:w-20 text-right border rounded-md p-1 text-xs ${
                          !selectedMembers.includes(member.id) ? 'opacity-50' : ''
                        } bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500 outline-none`}
                        disabled={!selectedMembers.includes(member.id)}
                      />
                      
                      <div className="flex gap-1 ml-1">
                        {shouldShowAutocompleteForMember(member.id) && (
                          <div 
                            onClick={autocompleteLastMember} 
                            className="px-1.5 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-400 rounded-md"
                            title={t('autocomplete')}
                          >
                            <span className="hidden sm:inline">{t('autocomplete')}</span>
                            <span className="sm:hidden">Auto</span>
                          </div>
                        )}
                        
                        {/* Botón para asignar todo a este miembro */}
                        {selectedMembers.includes(member.id) && member.id !== paidById && (
                          <div 
                            onClick={() => assignAllToMember(member.id)} 
                            className="px-1.5 py-0.5 text-[10px] bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-md"
                            title={t('assignAll')}
                          >
                            <span className="hidden sm:inline">{t('assignAll')}</span>
                            <span className="sm:hidden">Todo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="w-16 sm:w-20 text-right text-xs">
                        {sharePerPerson.toFixed(2)} {currency}
                      </span>
                      
                      {/* Botón para asignar todo incluso en modo equal */}
                      {selectedMembers.includes(member.id) && member.id !== paidById && (
                        <div 
                          onClick={() => assignAllToMember(member.id)} 
                          className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-md"
                          title={t('assignAll')}
                        >
                          <span className="hidden sm:inline">{t('assignAll')}</span>
                          <span className="sm:hidden">Todo</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span className={`w-16 sm:w-20 text-xs font-medium ${
                    member.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : 
                    member.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 
                    'text-slate-400 dark:text-slate-500'
                  }`}>
                    {member.balance > 0 ? '+' : ''}{member.balance.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Footer summary */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 flex flex-col xs:flex-row xs:justify-between xs:items-center gap-2">
          <div className="text-xs font-medium">
            {isCustomDivision 
              ? t('totalAmount') 
              : t('eachPersonPays')}: {isCustomDivision ? amount.toFixed(2) : sharePerPerson.toFixed(2)} {currency}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedMembers.length} {t('membersSelected')}
          </div>
        </div>
      </div>
    </div>
  );
} 