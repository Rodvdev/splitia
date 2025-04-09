import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    name: String!
    email: String!
    image: String
  }

  type CustomCategory {
    id: ID!
    name: String!
    icon: String
    color: String
  }
  
  type Group {
    id: ID!
    name: String!
    description: String
    image: String
    members: [GroupMember!]
    createdBy: User
    createdById: ID
    conversation: Conversation
    conversationId: ID
  }

  type GroupMember {
    id: ID!
    name: String!
    email: String
    image: String
    role: GroupRole!
  }

  enum GroupRole {
    ADMIN
    MEMBER
    GUEST
    ASSISTANT
  }

  input GroupInput {
    name: String!
    description: String
    image: String
  }

  input GroupMemberInput {
    email: String!
    role: GroupRole!
  }

  type Expense {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    amount: Float!
    description: String!
    date: DateTime!
    categoryId: ID
    currency: String!
    location: String
    notes: String
    paidBy: User!
    paidById: ID!
    group: Group
    groupId: ID
    category: CustomCategory
    shares: [ExpenseShare!]
  }

  type ExpenseShare {
    id: ID!
    amount: Float!
    type: ShareType!
    user: User!
    userId: ID!
  }

  enum ShareType {
    EQUAL
    PERCENTAGE
    FIXED
  }

  input ExpenseShareInput {
    userId: ID!
    amount: Float!
    type: ShareType!
  }

  input ExpenseInput {
    amount: Float!
    description: String!
    date: DateTime!
    categoryId: ID
    currency: String!
    location: String
    notes: String
    groupId: ID
    shares: [ExpenseShareInput!]
  }

  input UpdateExpenseInput {
    id: ID!
    amount: Float
    description: String
    date: DateTime
    categoryId: ID
    currency: String
    location: String
    notes: String
    groupId: ID
    shares: [ExpenseShareInput!]
  }

  type Conversation {
    id: ID!
    isGroupChat: Boolean!
    participants: [User!]!
    messages: [Message!]!
    group: Group
  }

  type Message {
    id: ID!
    content: String!
    createdAt: DateTime!
    conversationId: ID!
    sender: User!
    seenBy: [User!]!
    isAI: Boolean
  }

  input MessageInput {
    content: String!
    conversationId: ID!
  }

  type Query {
    expenses(
      limit: Int
      offset: Int
      groupId: ID
      categoryId: ID
      startDate: DateTime
      endDate: DateTime
    ): [Expense!]!
    expense(id: ID!): Expense
    categories: [CustomCategory!]!
    userGroups: [Group!]!
    group(id: ID!): Group
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation
    messages(conversationId: ID!, limit: Int, offset: Int): [Message!]!
  }

  type Mutation {
    createExpense(data: ExpenseInput!): Expense!
    updateExpense(data: UpdateExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!
    createCategory(name: String!, icon: String, color: String): CustomCategory!
    createGroup(data: GroupInput!): Group!
    addGroupMember(groupId: ID!, data: GroupMemberInput!): Boolean!
    removeGroupMember(groupId: ID!, userId: ID!): Boolean!
    leaveGroup(groupId: ID!): Boolean!
    deleteGroup(id: ID!): Boolean!
    sendMessage(data: MessageInput!): Message!
    createConversation(participantIds: [ID!]!): Conversation!
    createGroupChat(data: GroupChatInput!): Conversation!
    markMessageAsSeen(messageId: ID!): Boolean!
    deleteConversation(id: ID!): Boolean!
  }

  input GroupChatInput {
    name: String!
    participantIds: [ID!]!
  }
`; 