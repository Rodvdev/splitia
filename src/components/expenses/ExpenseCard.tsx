'use client';

import { 
  CreditCard,
  Calendar,
  User,
  Users,
  MoreVertical,
  Edit,
  Trash,
  Share
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpenseCardProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    paidBy: {
      id: string;
      name: string;
      image?: string;
    };
    currency: string;
    category?: {
      id: string;
      name: string;
      icon?: string;
      color?: string;
    };
    group?: {
      id: string;
      name: string;
    };
    shares: {
      id: string;
      amount: number;
      user: {
        id: string;
        name: string;
      };
    }[];
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  userLocale?: string;
}

export function ExpenseCard({ 
  expense, 
  onEdit, 
  onDelete, 
  onShare,
  userLocale = 'es'
}: ExpenseCardProps) {
  const dateLocale = userLocale === 'es' ? es : enUS;
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: expense.category?.color || '#CBD5E1' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{expense.description}</CardTitle>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onShare && (
                <DropdownMenuItem onClick={() => onShare(expense.id)}>
                  <Share className="mr-2 h-4 w-4" />
                  Compartir
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(expense.id)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex flex-wrap gap-2 mt-1">
          <span className="flex items-center text-xs">
            <Calendar className="mr-1 h-3 w-3" />
            {formatDistanceToNow(expense.date, { 
              addSuffix: true,
              locale: dateLocale 
            })}
          </span>
          
          {expense.category && (
            <Badge variant="outline" className="text-xs">
              {expense.category.name}
            </Badge>
          )}
          
          {expense.group && (
            <Badge variant="secondary" className="text-xs flex items-center">
              <Users className="mr-1 h-3 w-3" />
              {expense.group.name}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={expense.paidBy.image} 
                alt={expense.paidBy.name} 
              />
              <AvatarFallback>{expense.paidBy.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Pagado por {expense.paidBy.name}
            </span>
          </div>
          <div className="text-xl font-semibold">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
        </div>
      </CardContent>
      
      {expense.shares.length > 0 && (
        <CardFooter className="pt-0 border-t bg-muted/50 flex flex-col items-stretch">
          <div className="w-full text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Participantes</span>
              <span className="text-muted-foreground">Monto</span>
            </div>
            
            {expense.shares.map((share) => (
              <div key={share.id} className="flex justify-between py-1 border-t border-border/50">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {share.user.name}
                </span>
                <span>{formatCurrency(share.amount, expense.currency)}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 