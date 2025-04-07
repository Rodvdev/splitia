import { GraphQLClient } from 'graphql-request';

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

  return graphqlClient.request(query, variables);
}

// Helper function to fetch a single expense by ID
export async function fetchExpense(id: string) {
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

  return graphqlClient.request(query, { id });
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

  return graphqlClient.request(mutation, { data });
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

  return graphqlClient.request(mutation, { data });
}

// Helper function to delete an expense
export async function deleteExpense(id: string) {
  const mutation = `
    mutation DeleteExpense($id: ID!) {
      deleteExpense(id: $id)
    }
  `;

  return graphqlClient.request(mutation, { id });
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

  return graphqlClient.request(query);
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

  return graphqlClient.request(mutation, data);
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
      }
    }
  `;

  try {
    const response = await graphqlClient.request(query);
    return response;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return { userGroups: [] };
  }
}

// Helper function to fetch a single group
export async function getGroup(id: string) {
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
    return await graphqlClient.request(query, { id });
  } catch (error) {
    console.error('Error fetching group:', error);
    return { group: null };
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
    return await graphqlClient.request(mutation, { data });
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
} 