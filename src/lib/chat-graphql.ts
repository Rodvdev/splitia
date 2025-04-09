import { useState, useEffect } from 'react';
import React from 'react';
import { getAuthenticatedClient } from './graphql-client';

// Definir los tipos para las respuestas de la API
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: User;
  isAI: boolean;
  seenBy: User[];
}

export interface Conversation {
  id: string;
  isGroupChat: boolean;
  participants: User[];
  messages: Message[];
  group?: {
    id: string;
    name: string;
    description?: string;
    image?: string;
  };
}

// GraphQL Queries
const CONVERSATIONS_QUERY = `
  query GetConversations {
    conversations {
      id
      isGroupChat
      participants {
        id
        name
        email
        image
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
        }
        seenBy {
          id
        }
      }
      group {
        id
        name
        image
      }
    }
  }
`;

const CONVERSATION_QUERY = `
  query GetConversation($id: ID!) {
    conversation(id: $id) {
      id
      isGroupChat
      participants {
        id
        name
        email
        image
      }
      messages {
        id
        content
        createdAt
        sender {
          id
          name
          image
        }
        seenBy {
          id
        }
        isAI
      }
      group {
        id
        name
        description
        image
      }
    }
  }
`;

const MESSAGES_QUERY = `
  query GetMessages($conversationId: ID!, $limit: Int, $offset: Int) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      content
      createdAt
      sender {
        id
        name
        image
      }
      seenBy {
        id
      }
      isAI
    }
  }
`;


const CREATE_CONVERSATION_MUTATION = `
  mutation CreateConversation($participantIds: [ID!]!) {
    createConversation(participantIds: $participantIds) {
      id
      isGroupChat
      participants {
        id
        name
      }
    }
  }
`;

const CREATE_GROUP_CHAT_MUTATION = `
  mutation CreateGroupChat($data: GroupChatInput!) {
    createGroupChat(data: $data) {
      id
      isGroupChat
      participants {
        id
        name
      }
      group {
        id
        name
      }
    }
  }
`;

const MARK_MESSAGE_SEEN_MUTATION = `
  mutation MarkMessageSeen($messageId: ID!) {
    markMessageAsSeen(messageId: $messageId)
  }
`;

const DELETE_CONVERSATION_MUTATION = `
  mutation DeleteConversation($id: ID!) {
    deleteConversation(id: $id)
  }
`;

const ADD_GROUP_MEMBER_MUTATION = `
  mutation AddGroupMember($groupId: ID!, $data: GroupMemberInput!) {
    addGroupMember(groupId: $groupId, data: $data)
  }
`;

// GraphQL Error interface
interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, unknown>;
}

// Función para ejecutar queries GraphQL
async function fetchGraphQL(query: string, variables = {}) {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors.map((e: GraphQLError) => e.message).join('\n'));
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching GraphQL data:', error);
    throw error;
  }
}

// Hook para obtener todas las conversaciones
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchGraphQL(CONVERSATIONS_QUERY);
      setConversations(data.conversations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading, error, refetch: fetchConversations };
}

// Hook para obtener una conversación específica
export function useConversation(id: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversation = React.useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await fetchGraphQL(CONVERSATION_QUERY, { id });
      setConversation(data.conversation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchConversation();
  }, [id, fetchConversation]);

  return { conversation, loading, error, refetch: fetchConversation };
}

// Hook para obtener mensajes con paginación
export function useMessages(conversationId: string | null, limit = 30, offset = 0) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = React.useCallback(async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      const data = await fetchGraphQL(MESSAGES_QUERY, { conversationId, limit, offset });
      setMessages(data.messages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [conversationId, limit, offset]);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
  }, [conversationId, limit, offset, fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages };
}

// Función para enviar un mensaje
export async function sendMessage(conversationId: string, content: string) {
  const mutation = `
    mutation SendMessage($data: MessageInput!) {
      sendMessage(data: $data) {
        id
        content
        createdAt
        sender {
          id
          name
          image
        }
        seenBy {
          id
          name
        }
      }
    }
  `;

  try {
    const client = await getAuthenticatedClient();
    return await client.request(mutation, {
      data: { content, conversationId },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Función para crear una conversación directa
export async function createConversation(participantIds: string[]) {
  try {
    const data = await fetchGraphQL(CREATE_CONVERSATION_MUTATION, { participantIds });
    return data.createConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Función para crear un grupo de chat
export async function createGroupChat(name: string, participantIds: string[]) {
  try {
    const data = await fetchGraphQL(CREATE_GROUP_CHAT_MUTATION, {
      data: { name, participantIds },
    });
    return data.createGroupChat;
  } catch (error) {
    console.error('Error creating group chat:', error);
    throw error;
  }
}

// Función para marcar un mensaje como visto
export async function markMessageAsSeen(messageId: string) {
  try {
    const data = await fetchGraphQL(MARK_MESSAGE_SEEN_MUTATION, { messageId });
    return data.markMessageAsSeen;
  } catch (error) {
    console.error('Error marking message as seen:', error);
    throw error;
  }
}

// Función para eliminar una conversación
export async function deleteConversation(id: string) {
  try {
    const data = await fetchGraphQL(DELETE_CONVERSATION_MUTATION, { id });
    return data.deleteConversation;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Función para añadir un miembro a un grupo de chat
export async function addGroupMember(groupId: string, email: string, role: string = 'MEMBER') {
  try {
    const data = await fetchGraphQL(ADD_GROUP_MEMBER_MUTATION, { 
      groupId, 
      data: { 
        email, 
        role 
      } 
    });
    return data.addGroupMember;
  } catch (error) {
    console.error('Error adding member to group:', error);
    throw error;
  }
}