'use client';

import React, { useState } from 'react';
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
import { toast } from 'sonner';

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

// GraphQL hooks
import { 
  useConversations, 
  useConversation, 
  sendMessage as sendMessageApi, 
  Conversation,
  Message as ApiMessage
} from '@/lib/chat-graphql';
import { useSession } from 'next-auth/react';

// Interfaces for our app's data structure
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

interface AIMessageAction {
  id: string;
  label: string;
  action: string;
  color?: 'primary' | 'secondary' | 'destructive';
}

interface AIMessageWithButtons extends ChatMessage {
  buttons?: AIMessageAction[];
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  // Fetch conversations using GraphQL
  const { conversations, loading: loadingConversations, error: conversationsError, refetch: refetchConversations } = useConversations();
  
  // Fetch selected conversation
  const { 
    conversation: selectedConversationData, 
    loading: loadingConversation, 
    error: conversationError,
    refetch: refetchConversation
  } = useConversation(selectedConversationId);
  
  // Format GraphQL conversations to our app's structure
  const formattedConversations: ChatConversation[] = React.useMemo(() => {
    if (!conversations || !session?.user?.id) return [];
    
    return conversations.map((conv: Conversation) => {
      // Get conversation name based on type
      let name = '';
      let avatar = '';
      
      if (conv.isGroupChat && conv.group) {
        name = conv.group.name;
        avatar = conv.group.image || '';
      } else {
        // For direct messages, use the other participant's name
        const otherParticipant = conv.participants.find(p => p.id !== session.user?.id);
        if (otherParticipant) {
          name = otherParticipant.name;
          avatar = otherParticipant.image || '';
        }
      }
      
      // Sort messages by date (newest first) and get the first one as last message
      const sortedMessages = conv.messages ? 
        [...conv.messages].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ) : [];
      
      const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
      
      const isMessageSeen = lastMessage ? 
        lastMessage.seenBy.some(user => user.id === session.user?.id) : 
        true;
      
      return {
        id: conv.id,
        name,
        avatar,
        isGroup: conv.isGroupChat,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.createdAt
        } : undefined,
        unread: !isMessageSeen && lastMessage?.sender.id !== session.user?.id ? 1 : 0,
        members: conv.participants.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.image
        }))
      };
    });
  }, [conversations, session?.user?.id]);

  // Format conversation messages to our app's structure
  const formattedMessages: ChatMessage[] = React.useMemo(() => {
    if (!selectedConversationData || !session?.user?.id) return [];
    
    // Sort messages by date (oldest first for display)
    const sortedMessages = [...selectedConversationData.messages]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return sortedMessages.map((msg: ApiMessage) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender.id,
      senderName: msg.sender.name,
      senderAvatar: msg.sender.image,
      timestamp: msg.createdAt,
      isCurrentUser: msg.sender.id === session.user?.id
    }));
  }, [selectedConversationData, session?.user?.id]);

  // Filter conversations based on search query
  const filteredConversations = formattedConversations.filter(conversation =>
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

  // Function to display messages with buttons
  function MessageItem({ message }: { message: AIMessageWithButtons }) {
    // Handle button click
    const handleButtonClick = (action: string) => {
      console.log(`Action clicked: ${action}`);
      // Implement the action handling logic here
      // For example, add an expense, confirm a payment, etc.
    };

    return (
      <div className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className="flex items-start max-w-[80%]">
          {!message.isCurrentUser && (
            <Avatar className="mr-2 mt-0.5">
              {message.senderAvatar ? (
                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
              ) : (
                <AvatarFallback>{getAvatarFallback(message.senderName)}</AvatarFallback>
              )}
            </Avatar>
          )}
          <div>
            {!message.isCurrentUser && (
              <div className="text-sm text-muted-foreground mb-1">{message.senderName}</div>
            )}
            <div className={`p-3 rounded-lg ${
              message.isCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              
              {message.buttons && message.buttons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.buttons.map((btn) => (
                    <Button
                      key={btn.id}
                      variant={btn.color as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" || "secondary"}
                      size="sm"
                      onClick={() => handleButtonClick(btn.action)}
                    >
                      {btn.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
          {message.isCurrentUser && (
            <Avatar className="ml-2 mt-0.5">
              {message.senderAvatar ? (
                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
              ) : (
                <AvatarFallback>{getAvatarFallback(message.senderName)}</AvatarFallback>
              )}
            </Avatar>
          )}
        </div>
      </div>
    );
  }

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversationId || !session?.user?.id) return;
    
    try {
      // Send the message via API
      await sendMessageApi(selectedConversationId, messageInput);
      
      // Clear the input
      setMessageInput('');
      
      // Refresh the conversation and conversations list
      if (refetchConversation) refetchConversation();
      if (refetchConversations) refetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
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

  // Mark conversation as seen when selected
  React.useEffect(() => {
    if (selectedConversationId && selectedConversationData?.messages && selectedConversationData.messages.length > 0) {
      // Find the most recent message by date
      const newestMessage = [...selectedConversationData.messages]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      // Only mark as seen if it's not from the current user and not already seen
      if (
        newestMessage && 
        newestMessage.sender.id !== session?.user?.id &&
        !newestMessage.seenBy.some(user => user.id === session?.user?.id)
      ) {
        try {
          // This would be an API call to mark the message as seen
          // markMessageAsSeen(newestMessage.id);
        } catch (error) {
          console.error('Error marking message as seen:', error);
        }
      }
    }
  }, [selectedConversationId, selectedConversationData, session?.user?.id]);

  // Handle adding an AI assistant
  const handleAddAIAssistant = async () => {
    if (!selectedConversationId) return;
    
    try {
      // Show loading state
      toast.info(t('addingAIAssistant') || 'Adding AI assistant...');
      
      // Get the group ID from the selected conversation
      const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);
      
      if (!selectedConversation?.isGroup) {
        toast.error(t('aiAssistantGroupOnly') || 'AI assistant can only be added to group chats');
        return;
      }
      
      // Find the group ID from the conversation
      const conversationDetails = await fetch(`/api/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetConversation($id: ID!) {
              conversation(id: $id) {
                id
                group {
                  id
                }
              }
            }
          `,
          variables: { id: selectedConversationId },
        }),
      }).then(res => res.json());
      
      const groupId = conversationDetails?.data?.conversation?.group?.id;
      
      if (!groupId) {
        toast.error(t('aiAssistantNoGroup') || 'No group found for this conversation');
        return;
      }
      
      console.log('Adding AI Assistant to group:', groupId);
      
      // Call the API to add the assistant
      const response = await fetch('/api/ai-assistant/add-to-group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });
      
      const result = await response.json();
      console.log('API response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to add AI assistant');
      }
      
      // Show success message
      toast.success(t('aiAssistantAdded') || 'AI assistant added to group!');
      
      // Refresh the conversation to show the new member
      await refetchConversation();
      
      // Also refresh conversations list to update participant count
      await refetchConversations();
    } catch (error) {
      console.error('Error adding AI assistant:', error);
      // Show more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${t('aiAssistantAddError') || 'Error adding AI assistant'}: ${errorMessage}`);
    }
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
          {loadingConversations ? (
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
          ) : conversationsError ? (
            // Error loading conversations
            <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
              <div>
                <p className="text-red-500 mb-2">{t('errorLoading')}</p>
                <Button 
                  variant="outline" 
                  className="mt-2 mb-4"
                  onClick={() => refetchConversations()}
                >
                  {t('tryAgain')}
                </Button>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleCreateChat} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('newChat')}
                  </Button>
                  <Button onClick={() => router.push('/dashboard/groups/create')} variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    {t('createGroup')}
                  </Button>
                </div>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            // No conversations found
            <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
              <div>
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">{t('noConversations')}</p>
                <p className="text-sm mb-4 max-w-[220px] mx-auto">{t('description')}</p>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleCreateChat} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('newChat')}
                  </Button>
                  <Button onClick={() => router.push('/dashboard/groups/create')} variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    {t('createGroup')}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Conversation list
            <div className="p-3 space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                    selectedConversationId === conversation.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
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
          )}
        </ScrollArea>
      </div>
      
      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Avatar>
                  {filteredConversations.find(c => c.id === selectedConversationId)?.avatar ? (
                    <AvatarImage 
                      src={filteredConversations.find(c => c.id === selectedConversationId)?.avatar || ''} 
                      alt={filteredConversations.find(c => c.id === selectedConversationId)?.name || ''} 
                    />
                  ) : null}
                  <AvatarFallback>
                    {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      getAvatarFallback(filteredConversations.find(c => c.id === selectedConversationId)?.name || '')
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {filteredConversations.find(c => c.id === selectedConversationId)?.name}
                  </h2>
                  {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {filteredConversations.find(c => c.id === selectedConversationId)?.members?.length || 0} {t('groupChat')}
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
                  {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup && (
                    <>
                      <DropdownMenuItem className="cursor-pointer">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('addMembers')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={handleAddAIAssistant}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M7 7h.01" />
                          <path d="M12 7h.01" />
                          <path d="M17 7h.01" />
                          <path d="m7 12 1 1 1.5-1.5" />
                          <path d="M12 12h.01" />
                          <path d="M17 12h.01" />
                          <path d="M7 17h.01" />
                          <path d="M12 17h.01" />
                          <path d="M17 17h.01" />
                        </svg>
                        {t('addAIAssistant')}
                      </DropdownMenuItem>
                    </>
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
              {loadingConversation ? (
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
              ) : conversationError ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <p className="text-red-500">{t('errorLoading')}</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-sm"
                      onClick={() => refetchConversation()}
                    >
                      {t('tryAgain')}
                    </Button>
                  </div>
                </div>
              ) : formattedMessages.length > 0 ? (
                <div className="space-y-4">
                  {formattedMessages.map((message) => (
                    <MessageItem key={message.id} message={message as AIMessageWithButtons} />
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
        {selectedConversationId ? (
          <>
            {/* Chat Header with back button */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedConversationId(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </Button>
                <Avatar>
                  {filteredConversations.find(c => c.id === selectedConversationId)?.avatar ? (
                    <AvatarImage 
                      src={filteredConversations.find(c => c.id === selectedConversationId)?.avatar || ''} 
                      alt={filteredConversations.find(c => c.id === selectedConversationId)?.name || ''} 
                    />
                  ) : null}
                  <AvatarFallback>
                    {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      getAvatarFallback(filteredConversations.find(c => c.id === selectedConversationId)?.name || '')
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {filteredConversations.find(c => c.id === selectedConversationId)?.name}
                  </h2>
                  {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup && (
                    <p className="text-xs text-muted-foreground">
                      {filteredConversations.find(c => c.id === selectedConversationId)?.members?.length || 0} {t('groupChat')}
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
                  {filteredConversations.find(c => c.id === selectedConversationId)?.isGroup && (
                    <>
                      <DropdownMenuItem className="cursor-pointer">
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('addMembers')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={handleAddAIAssistant}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M7 7h.01" />
                          <path d="M12 7h.01" />
                          <path d="M17 7h.01" />
                          <path d="m7 12 1 1 1.5-1.5" />
                          <path d="M12 12h.01" />
                          <path d="M17 12h.01" />
                          <path d="M7 17h.01" />
                          <path d="M12 17h.01" />
                          <path d="M17 17h.01" />
                        </svg>
                        {t('addAIAssistant')}
                      </DropdownMenuItem>
                    </>
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
              {loadingConversation ? (
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
              ) : conversationError ? (
                <div className="flex items-center justify-center h-full text-center text-red-500">
                  <div>
                    <p>{t('errorLoading')}</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-sm"
                      onClick={() => refetchConversation()}
                    >
                      {t('tryAgain')}
                    </Button>
                  </div>
                </div>
              ) : formattedMessages.length > 0 ? (
                <div className="space-y-4">
                  {formattedMessages.map((message) => (
                    <MessageItem key={message.id} message={message as AIMessageWithButtons} />
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