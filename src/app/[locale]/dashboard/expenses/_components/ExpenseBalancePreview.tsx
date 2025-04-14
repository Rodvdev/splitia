import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';


interface BalancePreviewProps {
  amount: number;
  currency: string;
  groupMembers: User[];
  paidById?: string;
}


export function ExpenseBalancePreview({ amount, currency, groupMembers, paidById }: BalancePreviewProps) {
  // Calculate share per person
  const activeMembers = groupMembers.length;
  const sharePerPerson = amount / activeMembers;

  // Calculate what each person owes/gets
  const balances = groupMembers.map(member => {
    let balance = -sharePerPerson; // By default, everyone owes their share
    
    // If this member paid, they get back everyone else's share
    if (member.id === paidById) {
      balance = amount - sharePerPerson; // They get the total minus their own share
    }
    
    return {
      ...member,
      balance
    };
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Balance Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {balances.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.image || ''} />
                    <AvatarFallback>
                      {member.name?.charAt(0) || member.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name || member.email}</p>
                    {member.id === paidById && (
                      <p className="text-xs text-muted-foreground">Paid the bill</p>
                    )}
                  </div>
                </div>
                <div className={`text-sm font-medium ${member.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {member.balance > 0 ? '+' : ''}{member.balance.toFixed(2)} {currency}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Each person pays: {sharePerPerson.toFixed(2)} {currency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 