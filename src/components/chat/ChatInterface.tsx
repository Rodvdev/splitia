'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Paperclip,
  Send,
  SmilePlus,
  MoreVertical,
  Info,
  Users,
  UserPlus,
  LogOut,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  isAI: boolean;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
  seenBy: {
    id: string;
    name: string;
  }[];
}

interface Participant {
  id: string;
  name: string;
  image?: string;
  isOnline?: boolean;
}

interface ChatInterfaceProps {
  name: string;
  isGroup: boolean;
  participants: Participant[];
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onAddParticipant?: () => void;
  onViewInfo?: () => void;
  onLeaveChat?: () => void;
}

export function ChatInterface({
  name,
  isGroup,
  participants,
  messages,
  currentUserId,
  onSendMessage,
  onAddParticipant,
  onViewInfo,
  onLeaveChat,
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Format timestamp for messages
  const formatMessageTime = (date: Date) => {
    const today = new Date();
    
    // If message is from today, only show time
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm');
    }
    
    // If message is from this year, show date without year
    if (date.getFullYear() === today.getFullYear()) {
      return format(date, "d 'de' MMMM", { locale: es });
    }
    
    // If message is from previous years, show full date
    return format(date, "d 'de' MMMM yyyy", { locale: es });
  };
  
  // Handle message submission
  const handleSubmit = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={participants[0]?.image} alt={name} />
                <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Avatar className="h-5 w-5 absolute -bottom-1 -right-1 border-2 border-background">
                <AvatarFallback>
                  <Users className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <Avatar className="h-10 w-10">
              <AvatarImage src={participants[0]?.image} alt={participants[0]?.name} />
              <AvatarFallback>{participants[0]?.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
          )}
          
          <div>
            <h3 className="font-medium text-base">{name}</h3>
            <p className="text-xs text-muted-foreground">
              {isGroup 
                ? `${participants.length} participantes` 
                : participants[0]?.isOnline ? 'En línea' : 'Desconectado'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewInfo && (
                <DropdownMenuItem onClick={onViewInfo}>
                  <Info className="h-4 w-4 mr-2" />
                  Ver información
                </DropdownMenuItem>
              )}
              {isGroup && onAddParticipant && (
                <DropdownMenuItem onClick={onAddParticipant}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir participante
                </DropdownMenuItem>
              )}
              {onLeaveChat && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLeaveChat} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    {isGroup ? 'Salir del grupo' : 'Eliminar chat'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isCurrentUser = message.sender.id === currentUserId;
            const isAI = message.isAI;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex gap-2 max-w-[80%]">
                  {!isCurrentUser && !isAI && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={message.sender.image} alt={message.sender.name} />
                      <AvatarFallback>{message.sender.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    {isGroup && !isCurrentUser && !isAI && (
                      <p className="text-xs text-muted-foreground ml-1 mb-1">
                        {message.sender.name}
                      </p>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 ${
                      isAI 
                        ? 'bg-secondary text-secondary-foreground'
                        : isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      
                      {isCurrentUser && message.seenBy.length > 0 && !isGroup && (
                        <span className="text-xs text-blue-500">Visto</span>
                      )}
                      
                      {isCurrentUser && isGroup && message.seenBy.length > 0 && (
                        <Badge variant="outline" className="h-4 px-1">
                          <span className="text-[10px]">
                            {message.seenBy.length} {message.seenBy.length === 1 ? 'visto' : 'vistos'}
                          </span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2 items-end">
          <Button variant="outline" size="icon" className="rounded-full">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Textarea
            ref={inputRef}
            placeholder="Escribe un mensaje..."
            className="min-h-10 flex-1 resize-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button variant="outline" size="icon" className="rounded-full">
            <SmilePlus className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="rounded-full" 
            onClick={handleSubmit}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 