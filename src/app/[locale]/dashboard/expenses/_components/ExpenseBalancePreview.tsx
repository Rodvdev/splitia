import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { ToggleButton } from '@/components/ui/toggle-button';

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

  // Handle member selection
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prevSelected =>
      prevSelected.includes(memberId)
        ? prevSelected.filter(id => id !== memberId)
        : [...prevSelected, memberId]
    );
  };

  // Handle custom amount change
  const handleCustomAmountChange = (memberId: string, value: string) => {
    const amount = parseFloat(value) || 0;
    setCustomAmounts(prev => ({ ...prev, [memberId]: amount }));

    // Adjust other members' amounts to keep the total consistent
    const totalCustomAmount = Object.values(customAmounts).reduce((sum, amt) => sum + amt, 0);
    const remainingAmount = amount - totalCustomAmount;
    const otherMembers = selectedMembers.filter(id => id !== memberId);
    const shareForOthers = remainingAmount / otherMembers.length;

    setCustomAmounts(prev => {
      const updatedAmounts = { ...prev };
      otherMembers.forEach(id => {
        updatedAmounts[id] = shareForOthers;
      });
      return updatedAmounts;
    });
  };

  // Calculate share per person
  const activeMembers = selectedMembers.length;
  const sharePerPerson = amount / activeMembers;

  // Calculate what each person owes/gets
  const balances = groupMembers.map(member => {
    if (!selectedMembers.includes(member.id)) {
      return { ...member, balance: 0 };
    }
    const customAmount = customAmounts[member.id] || sharePerPerson;
    let balance = -customAmount; // By default, everyone owes their share
    
    // If this member paid, they get back everyone else's share
    if (member.id === paidById) {
      const totalOwedByOthers = selectedMembers.reduce((sum, id) => {
        if (id !== member.id) {
          return sum + (customAmounts[id] || sharePerPerson);
        }
        return sum;
      }, 0);
      balance = amount - totalOwedByOthers; // They get the total minus what others owe
    }
    
    return {
      ...member,
      balance
    };
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {balances.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ToggleButton
                    isActive={selectedMembers.includes(member.id)}
                    onClick={() => toggleMemberSelection(member.id)}
                    className="h-8 w-8"
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
                      <p className="text-xs text-muted-foreground">{t('paidTheBill')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customAmounts[member.id] || sharePerPerson}
                    onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                    className="w-20 text-right border rounded-md"
                  />
                  <span className={`text-sm font-medium ${member.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {member.balance > 0 ? '+' : ''}{member.balance.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {t('eachPersonPays')}: {sharePerPerson.toFixed(2)} {currency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 