import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { ToggleButton } from '@/components/ui/toggle-button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';

interface BalancePreviewProps {
  amount: number;
  currency: string;
  groupMembers: User[];
  paidById?: string;
  selectedMembers: string[];
  setSelectedMembers: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ExpenseBalancePreview({ amount, currency, groupMembers, paidById, selectedMembers, setSelectedMembers }: BalancePreviewProps) {
  const t = useTranslations('expenses.form.balancePreview');

  // State to track custom amounts for each member
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: number }>({});
  const [isCustomDivision, setIsCustomDivision] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(amount);
  
  // Calculate share per person
  const activeMembers = selectedMembers.length || 1; // Prevent division by zero
  const sharePerPerson = parseFloat((amount / activeMembers).toFixed(2));
  
  // Initialize custom amounts when switching to custom mode or when members change
  useEffect(() => {
    if (isCustomDivision) {
      const defaultAmounts: { [key: string]: number } = {};
      selectedMembers.forEach(id => {
        defaultAmounts[id] = customAmounts[id] !== undefined ? customAmounts[id] : sharePerPerson;
      });
      setCustomAmounts(defaultAmounts);
    }
  }, [isCustomDivision, selectedMembers, sharePerPerson, customAmounts]);
  
  // Recalculate total allocated and remaining amount
  useEffect(() => {
    if (isCustomDivision) {
      const total = Object.entries(customAmounts)
        .filter(([id]) => selectedMembers.includes(id))
        .reduce((sum, [, amt]) => sum + amt, 0);
      setRemainingAmount(parseFloat((amount - total).toFixed(2)));
    } else {
      setRemainingAmount(0); // No remaining amount in equal division
    }
  }, [customAmounts, selectedMembers, amount, isCustomDivision]);

  // Handle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prevSelected => {
      // If removing, delete from customAmounts
      if (prevSelected.includes(memberId)) {
        setCustomAmounts(prev => {
          const updated = { ...prev };
          delete updated[memberId];
          return updated;
        });
        return prevSelected.filter(id => id !== memberId);
      }
      // If adding, set initial custom amount
      else {
        setCustomAmounts(prev => ({
          ...prev,
          [memberId]: sharePerPerson
        }));
        return [...prevSelected, memberId];
      }
    });
  };

  // Handle custom amount change
  const handleCustomAmountChange = (memberId: string, value: string) => {
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
  };

  // Distribute remaining amount equally among members
  const distributeRemaining = () => {
    if (remainingAmount !== 0 && selectedMembers.length > 0) {
      const amountPerMember = remainingAmount / selectedMembers.length;
      setCustomAmounts(prev => {
        const updated = { ...prev };
        selectedMembers.forEach(id => {
          updated[id] = (updated[id] || 0) + amountPerMember;
        });
        return updated;
      });
    }
  };

  // Autocomplete the last member's amount
  const autocompleteLastMember = () => {
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
  };

  // Check if autocomplete button should be shown
  const shouldShowAutocomplete = () => {
    if (remainingAmount === 0 || !isCustomDivision) return false;
    
    // Count members with custom amounts set
    const membersWithCustomAmount = selectedMembers.filter(
      id => customAmounts[id] !== undefined && customAmounts[id] !== 0
    ).length;
    
    // Show autocomplete when all but one member have amounts set
    return membersWithCustomAmount >= selectedMembers.length - 1 && 
           selectedMembers.length > 0 && 
           remainingAmount !== 0;
  };

  // Reset to equal division
  const resetToEqual = () => {
    const equalAmounts: { [key: string]: number } = {};
    const totalAmount = parseFloat((sharePerPerson * selectedMembers.length).toFixed(2));
    const correction = parseFloat((amount - totalAmount).toFixed(2));
    selectedMembers.forEach((id) => {
      equalAmounts[id] = sharePerPerson;
    });
    if (correction !== 0) {
      // Assign the remaining cent to the first member
      equalAmounts[selectedMembers[0]] += correction;
    }
    setCustomAmounts(equalAmounts);
  };

  // Select or deselect all members
  const toggleAllMembers = () => {
    if (selectedMembers.length === groupMembers.length) {
      // Deselect all except payer
      const newSelected = paidById ? [paidById] : [];
      setSelectedMembers(newSelected);
    } else {
      // Select all
      setSelectedMembers(groupMembers.map(m => m.id));
    }
  };

  // Calculate what each person owes/gets - use memoization to avoid recalculations
  const balances = React.useMemo(() => groupMembers.map(member => {
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

  return (
    <Card className="mt-4 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('subtitle')}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {isCustomDivision ? t('customDivision') : t('equalDivision')}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Switch
                    checked={isCustomDivision}
                    onCheckedChange={setIsCustomDivision}
                    className="ml-2"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{t('switchTip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isCustomDivision && (
          <div className="mb-4 bg-muted p-2 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${remainingAmount !== 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  {remainingAmount !== 0 
                    ? t('remainingToAllocate') 
                    : t('fullyAllocated')}:
                  {' '}{remainingAmount.toFixed(2)} {currency}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{t('remainingAmountTip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2">
                <div 
                  onClick={resetToEqual} 
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {t('resetEqual')}
                </div>
                {shouldShowAutocomplete() ? (
                  <div 
                    onClick={autocompleteLastMember} 
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition-colors text-blue-700"
                  >
                    {t('autocomplete')}
                  </div>
                ) : remainingAmount !== 0 && (
                  <div 
                    onClick={distributeRemaining} 
                    className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                  >
                    {t('distributeRemaining')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-2 flex justify-between items-center">
          <div className="flex gap-2">
            <div 
              onClick={toggleAllMembers}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {selectedMembers.length === groupMembers.length ? t('deselectAll') : t('selectAll')}
            </div>
          </div>
          <div className="flex text-xs text-muted-foreground">
            <span className="mr-8">{t('amount')}</span>
            <span>{t('balance')}</span>
          </div>
        </div>
        
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {balances.map((member) => (
              <div 
                key={member.id} 
                className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                  selectedMembers.includes(member.id) ? 'bg-blue-50' : 'bg-white'
                } ${member.id === paidById ? 'border border-blue-200' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <ToggleButton
                    isActive={selectedMembers.includes(member.id)}
                    onClick={() => toggleMemberSelection(member.id)}
                    className="h-7 w-7"
                  >
                    {selectedMembers.includes(member.id) ? '✓' : ''}
                  </ToggleButton>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image || ''} />
                    <AvatarFallback>
                      {member.name?.charAt(0) || member.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name || member.email}</p>
                    {member.id === paidById && (
                      <p className="text-xs text-blue-600">{t('paidTheBill')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isCustomDivision && (
                    <input
                      type="number"
                      step="0.01"
                      value={customAmounts[member.id] !== undefined ? customAmounts[member.id] : sharePerPerson}
                      onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                      className={`w-20 text-right border rounded-md p-1 ${
                        !selectedMembers.includes(member.id) ? 'opacity-50' : ''
                      }`}
                      disabled={!selectedMembers.includes(member.id)}
                    />
                  )}
                  {!isCustomDivision && (
                    <span className="w-20 text-right text-sm">
                      {isCustomDivision && customAmounts[member.id] !== undefined ? customAmounts[member.id].toFixed(2) : sharePerPerson.toFixed(2)} {currency}
                    </span>
                  )}
                  <span className={`w-20 text-sm font-medium ${
                    member.balance > 0 ? 'text-green-600' : member.balance < 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {member.balance > 0 ? '+' : ''}{member.balance.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <div className="text-sm font-medium">
            {isCustomDivision 
              ? t('totalAmount') 
              : t('eachPersonPays')}: {isCustomDivision ? amount.toFixed(2) : sharePerPerson.toFixed(2)} {currency}
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedMembers.length} {t('membersSelected')}
          </div>
          {shouldShowAutocomplete() && (
            <div 
              onClick={autocompleteLastMember} 
              className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition-colors text-blue-700"
            >
              {t('autocomplete')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 