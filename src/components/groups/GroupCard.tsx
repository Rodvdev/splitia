'use client';

import { 
  MoreVertical, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  UserPlus,
  Trash,
  CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    memberCount: number;
    expenseCount: number;
    totalAmount?: number;
    currency?: string;
    isAdmin?: boolean;
    members: {
      id: string;
      name: string;
      image?: string;
    }[];
  };
  onInvite?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLeave?: (id: string) => void;
}

export function GroupCard({ group, onInvite, onDelete, onLeave }: GroupCardProps) {
  const router = useRouter();
  
  const navigateToGroupDetails = () => {
    router.push(`/dashboard/groups/${group.id}`);
  };
  
  const navigateToGroupChat = () => {
    router.push(`/dashboard/chat/${group.id}`);
  };
  
  const navigateToGroupExpenses = () => {
    router.push(`/dashboard/groups/${group.id}/expenses`);
  };
  
  // Only show up to 3 members avatars
  const visibleMembers = group.members.slice(0, 3);
  const extraMembersCount = Math.max(0, group.members.length - 3);
  
  // Format currency if available
  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || currency === undefined) return '';
    
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {group.image && (
        <div className="relative h-32 w-full">
          <Image
            src={group.image}
            alt={group.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-4">
            <Badge className="bg-white/90 text-black hover:bg-white/80">
              <Users className="mr-1 h-3 w-3" />
              {group.memberCount}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className={group.image ? "pt-3" : ""}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl cursor-pointer hover:text-primary" onClick={navigateToGroupDetails}>
              {group.name}
            </CardTitle>
            {group.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {group.description}
              </CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones del grupo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateToGroupDetails}>
                <Settings className="mr-2 h-4 w-4" />
                Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={navigateToGroupChat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={navigateToGroupExpenses}>
                <CreditCard className="mr-2 h-4 w-4" />
                Gastos
              </DropdownMenuItem>
              {group.isAdmin && onInvite && (
                <DropdownMenuItem onClick={() => onInvite(group.id)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invitar miembros
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {group.isAdmin && onDelete ? (
                <DropdownMenuItem 
                  onClick={() => onDelete(group.id)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar grupo
                </DropdownMenuItem>
              ) : onLeave && (
                <DropdownMenuItem 
                  onClick={() => onLeave(group.id)}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir del grupo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {visibleMembers.map((member) => (
              <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                <AvatarImage src={member.image} alt={member.name} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            
            {extraMembersCount > 0 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-medium border-2 border-background">
                +{extraMembersCount}
              </div>
            )}
          </div>
          
          {group.totalAmount !== undefined && group.currency && (
            <div className="text-sm">
              <span className="text-muted-foreground">Total:</span>{' '}
              <span className="font-medium">
                {formatCurrency(group.totalAmount, group.currency)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t flex justify-between pt-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={navigateToGroupExpenses}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          {group.expenseCount} gastos
        </Button>
      </CardFooter>
    </Card>
  );
} 