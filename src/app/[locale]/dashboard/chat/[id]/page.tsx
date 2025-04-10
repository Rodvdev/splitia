'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ChatClientPage from '@/components/chat/chat-client-page';

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';

  return <ChatClientPage initialConversationId={id} />;
} 