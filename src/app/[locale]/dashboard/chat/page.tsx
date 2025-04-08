'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Send, 
  Users,
  MessageCircle,
  MoreVertical,
  UserPlus,
  LogOut,
  Trash,
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interface for chat data
interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  isCurrentUser: boolean;
}

interface ChatConversation {
  id: string;
  name: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unread: number;
  members?: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for conversations and messages
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const mockConversations: ChatConversation[] = [
        {
          id: '1',
          name: 'Vacation Group',
          isGroup: true,
          lastMessage: {
            content: 'When are we meeting for dinner?',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          },
          unread: 3,
          members: [
            { id: '1', name: 'John Doe' },
            { id: '2', name: 'Alice Smith' },
            { id: '3', name: 'Bob Johnson' },
            { id: '4', name: 'Current User' }
          ]
        },
        {
          id: '2',
          name: 'Alice Smith',
          isGroup: false,
          lastMessage: {
            content: 'Thanks for the info!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
          unread: 0,
        },
        {
          id: '3',
          name: 'Apartment Expenses',
          isGroup: true,
          lastMessage: {
            content: 'I paid the electricity bill',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          },
          unread: 1,
        },
        {
          id: '4',
          name: 'Bob Johnson',
          isGroup: false,
          lastMessage: {
            content: 'Are we still on for tomorrow?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          },
          unread: 0,
        },
      ];
      
      setConversations(mockConversations);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!selectedConversation) return;
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          content: 'Hey everyone, what are our plans for the weekend?',
          senderId: '1',
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
          isCurrentUser: false,
        },
        {
          id: '2',
          content: 'I was thinking we could go hiking on Saturday',
          senderId: '2',
          senderName: 'Alice Smith',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
          isCurrentUser: false,
        },
        {
          id: '3',
          content: 'That sounds great! What time should we meet?',
          senderId: '3',
          senderName: 'Bob Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          isCurrentUser: false,
        },
        {
          id: '4',
          content: 'I can drive if we want to carpool',
          senderId: '4',
          senderName: 'Current User',
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 minutes ago
          isCurrentUser: true,
        },
        {
          id: '5',
          content: 'When are we meeting for dinner?',
          senderId: '1',
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
          isCurrentUser: false,
        },
      ];
      
      setMessages(mockMessages);
      setIsLoading(false);
      
      // Mark conversation as read
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation ? { ...conv, unread: 0 } : conv
        )
      );
    }, 500);
  }, [selectedConversation]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversation) return;
    
    // Add message to the list
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageInput,
      senderId: '4', // Current user ID
      senderName: 'Current User',
      timestamp: new Date().toISOString(),
      isCurrentUser: true,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation 
          ? { 
              ...conv, 
              lastMessage: {
                content: messageInput,
                timestamp: new Date().toISOString(),
              } 
            } 
          : conv
      )
    );
    
    // Clear input
    setMessageInput('');
  };

  // Create a new chat
  const handleCreateChat = () => {
    router.push('/dashboard/chat/create');
  };

  // Generate avatar fallback from name
  const getAvatarFallback = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 border-r flex flex-col">
        <div className="p-4 border-b flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">{t('title')}</h1>
            <Button variant="ghost" size="icon" onClick={handleCreateChat}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {isLoading && !selectedConversation ? (
            // Loading skeletons for conversations
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="p-3 space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedConversation === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <Avatar>
                    {conversation.avatar ? (
                      <AvatarImage src={conversation.avatar} alt={conversation.name} />
                    ) : null}
                    <AvatarFallback>
                      {conversation.isGroup ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        getAvatarFallback(conversation.name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate">
                        {conversation.name}
                      </span>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conversation.unread > 0 && (
                    <Badge variant="default" className="text-xs">
                      {conversation.unread}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
              <div>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noConversations')}</p>
                <Button 
                  variant="link" 
                  className="mt-2 text-sm"
                  onClick={handleCreateChat}
                >
                  {t('newChat')}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  {conversations.find(c => c.id === selectedConversation)?.avatar ? (
                    <AvatarImage 
                      src={conversations.find(c => c.id === selectedConversation)?.avatar || ''} 
                      alt={conversations.find(c => c.id === selectedConversation)?.name || ''} 
                    />
                  ) : null}
                  <AvatarFallback>
                    {conversations.find(c => c.id === selectedConversation)?.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      getAvatarFallback(conversations.find(c => c.id === selectedConversation)?.name || '')
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </h2>
                  {conversations.find(c => c.id === selectedConversation)?.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {conversations.find(c => c.id === selectedConversation)?.members?.length || 0} {t('groupChat')}
                    </p>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {conversations.find(c => c.id === selectedConversation)?.isGroup && (
                    <DropdownMenuItem className="cursor-pointer">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('addMembers')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('leaveChat')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    {t('deleteChat')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                // Loading skeletons for messages
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                      {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                      <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-primary/10' : 'bg-muted'} rounded-lg p-3`}>
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-20 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-start gap-3 ${message.isCurrentUser ? 'justify-end' : ''}`}
                    >
                      {!message.isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          {message.senderAvatar ? (
                            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                          ) : null}
                          <AvatarFallback>
                            {getAvatarFallback(message.senderName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div 
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {!message.isCurrentUser && conversations.find(c => c.id === selectedConversation)?.isGroup && (
                          <p className="text-xs font-medium mb-1">{message.senderName}</p>
                        )}
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('noMessages')}</p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input
                placeholder={t('messageInput')}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          // No conversation selected state
          <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
            <div className="max-w-md">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('title')}</h3>
              <p className="mb-4">{t('description')}</p>
              <Button onClick={handleCreateChat}>
                <Plus className="h-4 w-4 mr-2" />
                {t('newChat')}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile: Show only conversation list if no selection, otherwise show chat */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header with back button */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedConversation(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </Button>
                <Avatar>
                  {conversations.find(c => c.id === selectedConversation)?.avatar ? (
                    <AvatarImage 
                      src={conversations.find(c => c.id === selectedConversation)?.avatar || ''} 
                      alt={conversations.find(c => c.id === selectedConversation)?.name || ''} 
                    />
                  ) : null}
                  <AvatarFallback>
                    {conversations.find(c => c.id === selectedConversation)?.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      getAvatarFallback(conversations.find(c => c.id === selectedConversation)?.name || '')
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {conversations.find(c => c.id === selectedConversation)?.name}
                  </h2>
                  {conversations.find(c => c.id === selectedConversation)?.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {conversations.find(c => c.id === selectedConversation)?.members?.length || 0} {t('groupChat')}
                    </p>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {conversations.find(c => c.id === selectedConversation)?.isGroup && (
                    <DropdownMenuItem className="cursor-pointer">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('addMembers')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('leaveChat')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    <Trash className="h-4 w-4 mr-2" />
                    {t('deleteChat')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                // Loading skeletons for messages
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                      {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                      <div className={`max-w-[70%] ${i % 2 === 0 ? 'bg-primary/10' : 'bg-muted'} rounded-lg p-3`}>
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-20 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex items-start gap-3 ${message.isCurrentUser ? 'justify-end' : ''}`}
                    >
                      {!message.isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          {message.senderAvatar ? (
                            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                          ) : null}
                          <AvatarFallback>
                            {getAvatarFallback(message.senderName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div 
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        {!message.isCurrentUser && conversations.find(c => c.id === selectedConversation)?.isGroup && (
                          <p className="text-xs font-medium mb-1">{message.senderName}</p>
                        )}
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('noMessages')}</p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input
                placeholder={t('messageInput')}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          // Default view - just the conversations list (handled above)
          null
        )}
      </div>
    </div>
  );
} 