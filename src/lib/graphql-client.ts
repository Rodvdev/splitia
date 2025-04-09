import { GraphQLClient } from 'graphql-request';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Create a client for consuming the GraphQL API
// In a browser environment, we need to construct a full URL
const getGraphQLEndpoint = () => {
  // Check if we're in a browser or server environment
  if (typeof window !== 'undefined') {
    // We're in the browser, so we can use window.location.origin
    return `${window.location.origin}/api/graphql`;
  }
  // We're on the server, use a relative path
  return '/api/graphql';
};

// Function to get authenticated GraphQL client
export async function getAuthenticatedClient() {
  let session;
  
  // In the browser, use fetch to get the session
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/auth/session');
      session = await response.json();
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  } else {
    // On the server, use getServerSession
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      console.error('Error getting server session:', error);
    }
  }
  
  // Create client with authentication headers if session exists
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (session?.user) {
    console.log('Adding user context to GraphQL request', {
      userId: session.user.id,
      email: session.user.email,
    });
    
    // Use the correct header format for JWT token authorization
    if (session.accessToken) {
      headers['Authorization'] = `Bearer ${session.accessToken}`;
    } else {
      console.warn('No accessToken found in session, authentication might fail');
    }
  } else {
    console.warn('No active session found when creating GraphQL client');
  }
  
  // Create and return the GraphQL client with proper auth headers and cookies
  return new GraphQLClient(getGraphQLEndpoint(), {
    credentials: 'include',  // This is critical for including cookies
    headers,
    cache: 'no-store',
    mode: 'cors',
  });
}

// Base GraphQL client without authentication
export const graphqlClient = new GraphQLClient(getGraphQLEndpoint(), {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to fetch expenses with optional filters
export async function fetchExpenses(variables: {
  limit?: number;
  offset?: number;
  groupId?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const query = `
    query GetExpenses(
      $limit: Int
      $offset: Int
      $groupId: ID
      $categoryId: ID
      $startDate: DateTime
      $endDate: DateTime
    ) {
      expenses(
        limit: $limit
        offset: $offset
        groupId: $groupId
        categoryId: $categoryId
        startDate: $startDate
        endDate: $endDate
      ) {
        id
        description
        amount
        currency
        date
        location
        notes
        paidBy {
          id
          name
          image
        }
        group {
          id
          name
          image
        }
        category {
          id
          name
          icon
          color
        }
        shares {
          id
          amount
          type
          user {
            id
            name
            image
          }
        }
      }
    }
  `;

  try {
    // Use authenticated client to ensure session token is sent
    const client = await getAuthenticatedClient();
    return await client.request(query, variables);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
}

// Helper function to fetch a single expense by ID
export async function fetchExpense(id: string): Promise<{ expense: { 
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  location?: string;
  notes?: string;
  paidBy: {
    id: string;
    name: string;
    image?: string;
  };
  group?: {
    id: string;
    name: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  shares: Array<{
    id: string;
    amount: number;
    type: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
} | null }> {
  const query = `
    query GetExpense($id: ID!) {
      expense(id: $id) {
        id
        description
        amount
        currency
        date
        location
        notes
        paidBy {
          id
          name
          image
        }
        group {
          id
          name
          image
        }
        category {
          id
          name
          icon
          color
        }
        shares {
          id
          amount
          type
          user {
            id
            name
            image
          }
        }
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(query, { id });
  } catch (error) {
    console.error('Error fetching expense details:', error);
    throw error;
  }
}

// Helper function to create a new expense
export async function createExpense(data: {
  amount: number;
  description: string;
  date: Date;
  categoryId?: string;
  currency: string;
  location?: string;
  notes?: string;
  groupId?: string;
  shares?: Array<{
    userId: string;
    amount: number;
    type: 'EQUAL' | 'PERCENTAGE' | 'FIXED';
  }>;
}) {
  const mutation = `
    mutation CreateExpense($data: ExpenseInput!) {
      createExpense(data: $data) {
        id
        description
        amount
        currency
        date
        location
        notes
        paidBy {
          id
          name
        }
        group {
          id
          name
        }
        category {
          id
          name
          icon
          color
        }
        shares {
          id
          amount
          type
          user {
            id
            name
          }
        }
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
}

// Helper function to update an existing expense
export async function updateExpense(data: {
  id: string;
  amount?: number;
  description?: string;
  date?: Date;
  categoryId?: string;
  currency?: string;
  location?: string;
  notes?: string;
  groupId?: string;
  shares?: Array<{
    userId: string;
    amount: number;
    type: 'EQUAL' | 'PERCENTAGE' | 'FIXED';
  }>;
}) {
  const mutation = `
    mutation UpdateExpense($data: UpdateExpenseInput!) {
      updateExpense(data: $data) {
        id
        description
        amount
        currency
        date
        location
        notes
        paidBy {
          id
          name
        }
        group {
          id
          name
        }
        category {
          id
          name
          icon
          color
        }
        shares {
          id
          amount
          type
          user {
            id
            name
          }
        }
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

// Helper function to delete an expense
export async function deleteExpense(id: string) {
  const mutation = `
    mutation DeleteExpense($id: ID!) {
      deleteExpense(id: $id)
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { id });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
}

// Helper function to fetch categories
export async function fetchCategories() {
  const query = `
    query GetCategories {
      categories {
        id
        name
        icon
        color
      }
    }
  `;

  try {
    // Use authenticated client to ensure session token is sent
    const client = await getAuthenticatedClient();
    return await client.request(query);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Helper function to create a new category
export async function createCategory(data: {
  name: string;
  icon?: string;
  color?: string;
}) {
  const mutation = `
    mutation CreateCategory($name: String!, $icon: String, $color: String) {
      createCategory(name: $name, icon: $icon, color: $color) {
        id
        name
        icon
        color
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, data);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Helper function to fetch user groups
export async function fetchUserGroups() {
  const query = `
    query GetUserGroups {
      userGroups {
        id
        name
        image
        description
        members {
          id
        }
      }
    }
  `;

  try {
    // Use authenticated client to ensure session is included
    const client = await getAuthenticatedClient();
    const response = await client.request(query);
    console.log('Successfully fetched user groups');
    return response;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw new Error('Failed to fetch user groups: ' + (error as Error).message);
  }
}

// Helper function to fetch a single group
export async function fetchGroup(id: string): Promise<{ group: { 
  id: string;
  name: string;
  description?: string;
  image?: string;
  members: Array<{
    id: string;
    name: string;
    email?: string;
    image?: string;
    role: string;
  }>;
} | null }> {
  const query = `
    query GetGroup($id: ID!) {
      group(id: $id) {
        id
        name
        description
        image
        members {
          id
          name
          email
          image
          role
        }
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(query, { id });
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
}

// Helper function to delete a group
export async function deleteGroup(id: string) {
  const mutation = `
    mutation DeleteGroup($id: ID!) {
      deleteGroup(id: $id)
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { id });
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
}

// Helper function to create a new group
export async function createGroup(data: {
  name: string;
  description?: string;
  image?: string;
}) {
  const mutation = `
    mutation CreateGroup($data: GroupInput!) {
      createGroup(data: $data) {
        id
        name
        description
        image
      }
    }
  `;

  try {
    console.log('Attempting to create group');
    
    // Use authenticated client
    const client = await getAuthenticatedClient();
    const result = await client.request(mutation, { data });
    console.log('Group created successfully');
    return result;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
}

// Helper function to invite members to a group
export async function inviteToGroup(data: {
  groupId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST' | 'ASSISTANT';
}) {
  const mutation = `
    mutation InviteToGroup($data: GroupInviteInput!) {
      inviteToGroup(data: $data) {
        id
        success
        email
        role
        expiresAt
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error inviting to group:', error);
    throw error;
  }
}

// Helper function to generate an invite link for a group
export async function generateGroupInvitation(data: {
  groupId: string;
  maxUses?: number;
  expiresAt?: Date;
}) {
  const mutation = `
    mutation GenerateGroupInvitation($data: GroupInvitationInput!) {
      generateGroupInvitation(data: $data) {
        id
        token
        url
        maxUses
        usedCount
        expiresAt
      }
    }
  `;

  // Create a new object without expiresAt if it's undefined or invalid
  const formattedData: { 
    groupId: string; 
    maxUses?: number; 
    expiresAt?: string; 
  } = { 
    groupId: data.groupId,
    maxUses: data.maxUses
  };
  
  // Only include expiresAt if it's defined and valid
  if (data.expiresAt && data.expiresAt instanceof Date && !isNaN(data.expiresAt.getTime())) {
    formattedData.expiresAt = data.expiresAt.toISOString();
  }

  try {
    console.log('Sending GroupInvitation mutation with data:', JSON.stringify(formattedData));
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data: formattedData });
  } catch (error) {
    console.error('Error generating group invite link:', error);
    throw error;
  }
}

// Helper function to change a member's role in a group
export async function changeGroupMemberRole(data: {
  groupId: string;
  memberId: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST' | 'ASSISTANT';
}) {
  const mutation = `
    mutation ChangeGroupMemberRole($data: GroupMemberRoleInput!) {
      changeGroupMemberRole(data: $data) {
        id
        role
        user {
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

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error changing group member role:', error);
    throw error;
  }
}

// Helper function to remove a member from a group
export async function removeGroupMember(data: {
  groupId: string;
  memberId: string;
}) {
  const mutation = `
    mutation RemoveGroupMember($data: GroupMemberInput!) {
      removeGroupMember(data: $data) {
        success
        message
      }
    }
  `;

  try {
    // Use authenticated client
    const client = await getAuthenticatedClient();
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
}

// Helper function to generate a basic invite link for a group (without expiry or usage limits)
export async function generateBasicGroupInvitation(groupId: string) {
  const mutation = `
    mutation GenerateBasicGroupInvitation($data: GroupInvitationInput!) {
      generateGroupInvitation(data: $data) {
        id
        token
        url
        maxUses
        usedCount
        expiresAt
      }
    }
  `;

  try {
    console.log('Sending basic group invite link mutation with groupId:', groupId);
    // Use authenticated client
    const client = await getAuthenticatedClient();
    
    // Use the structure expected by the API
    const data = { groupId };
    return await client.request(mutation, { data });
  } catch (error) {
    console.error('Error generating basic group invite link:', error);
    throw error;
  }
} 