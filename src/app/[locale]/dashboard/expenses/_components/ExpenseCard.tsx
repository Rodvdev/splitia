'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { CalendarIcon, MapPinIcon, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface ExpenseCardProps {
  expense: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    date: Date;
    category: string;
    location?: string;
    participants?: number;
    isPaid?: boolean;
    isGroupExpense?: boolean;
  };
  onClick?: (id: string) => void;
}

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const t = useTranslations('expenses');
  
  // Format the date to a human-readable string
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(expense.date);
  
  return (
    <Card 
      className={`overflow-hidden transition-all hover:shadow-md ${
        expense.isPaid ? 'border-green-200' : ''
      }`}
      onClick={() => onClick?.(expense.id)}
    >
      <CardHeader className="p-4 pb-0 flex flex-row justify-between items-start">
        <div>
          <h3 className="font-medium text-base">{expense.title}</h3>
          <Badge 
            variant="outline" 
            className="mt-1 bg-primary/10"
          >
            {expense.category}
          </Badge>
        </div>
        <span className="text-lg font-semibold">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="flex items-center text-muted-foreground text-sm mt-2">
          <CalendarIcon className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
        
        {expense.location && (
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{expense.location}</span>
          </div>
        )}
        
        {expense.isGroupExpense && (
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <Users className="h-4 w-4 mr-1" />
            <span>{expense.participants} {t('people')}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t">
        <div className="w-full flex justify-between items-center">
          <Badge 
            variant={expense.isPaid ? "default" : "secondary"}
            className={expense.isPaid ? "bg-green-100 text-green-800" : ""}
          >
            {expense.isPaid ? t('status.paid') : t('status.pending')}
          </Badge>
          
          <span className="text-sm text-muted-foreground">
            {expense.isGroupExpense ? t('type.group') : t('type.personal')}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
} 