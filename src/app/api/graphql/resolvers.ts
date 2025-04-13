import { prisma } from '@/lib/prisma';
import { GraphQLError } from 'graphql';
import { createGroupWithConversation, addUserToGroupAndConversation, createGroupChatWithGroup } from '@/lib/conversations';
import { PrismaClient } from '@prisma/client';

// Common type for transaction callback parameters
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// Helper function to get the session
async function getServerSession(context?: Context) {
  if (context?.user) {
    // If context already has user data, return it directly
    return {
      user: {
        id: context.user.id,
        email: context.user.email,
        externalId: context.user.externalId
      }
    };
  }
  
  // This fallback should rarely be needed since we're handling auth in the API route
  console.warn('No user context provided to getServerSession - this is unexpected');
  console.error('Authentication failed: User context missing');
  return null;
}

// Define ShareType enum to match the Prisma schema
enum ShareType {
  EQUAL = 'EQUAL',
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED'
}

// Define GroupRole enum to match the Prisma schema
enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
  ASSISTANT = 'ASSISTANT'
}

// Define SettlementStatus enum to match the Prisma schema
enum SettlementStatus {
  PENDING = 'PENDING',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Define SettlementType enum to match the Prisma schema
enum SettlementType {
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT'
}

// Basic type definitions for resolvers
interface Context {
  user?: {
    id: string;       // This is now the Prisma User ID
    email: string;
    externalId?: string; // This is the User ID
  };
  request: Request;
}

// Define common argument types
interface ExpenseArgs {
  id?: string;
  groupId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  offset?: number;
  limit?: number;
}

interface ExpenseShareInput {
  userId: string;
  amount: number;
  type: ShareType;
}

interface ExpenseInput {
  id?: string;
  amount: number;
  description: string;
  date: string;
  categoryId?: string | null;
  currency: string;
  location?: string | null;
  notes?: string | null;
  groupId?: string | null;
  paidById?: string | null;
  shares?: ExpenseShareInput[];
  isSettlement?: boolean;
  settlementType?: SettlementType;
  settlementStatus?: SettlementStatus;
  settledWithUserId?: string;
}

interface SettlementInput {
  amount: number;
  description?: string;
  groupId: string;
  toUserId: string;
  type?: SettlementType;
}

interface SettlementData {
  id: string;
  amount: number;
  currency: string;
  settlementStatus: SettlementStatus;
  settlementType: SettlementType;
  date: Date;
  description?: string | null;
  initiatedById: string;
  settledWithUserId: string;
  groupId: string;
  initiatedBy?: UserType;
  settledWithUser?: UserType;
  group?: GroupType;
}

interface CategoryInput {
  name: string;
  icon?: string | null;
  color?: string | null;
}

interface GroupInput {
  name: string;
  description?: string | null;
  image?: string | null;
}

interface GroupMemberInput {
  email: string;
  role: string;
}

// Define types based on the Prisma models
interface ExpenseType {
  id: string;
  amount: number;
  description: string;
  date: Date;
  categoryId?: string | null;
  paidById: string;
  groupId?: string | null;
  shares?: ExpenseShareType[];
  paidBy?: UserType;
  group?: GroupType;
  category?: CategoryType;
  isSettlement?: boolean;
  settlementId?: string | null;
  settlement?: SettlementData;
}

interface ExpenseShareType {
  id: string;
  amount: number;
  type: ShareType;
  userId: string;
  expenseId: string;
  user?: UserType;
}

interface UserType {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface GroupType {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  members?: Array<{
    userId: string;
    role: string;
    user: UserType;
  }>;
}

interface CategoryType {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

interface ConversationType {
  id: string;
  isGroupChat: boolean;
  participants?: Array<{
    id: string;
    user: UserType;
  }>;
  messages?: MessageType[];
  group?: GroupType;
  groupId?: string | null;
}

interface MessageType {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  conversationId: string;
  isAI: boolean;
  sender?: UserType;
  seenBy?: Array<{
    id: string;
    user: UserType;
  }>;
}

interface MessageInput {
  content: string;
  conversationId: string;
}

interface ConversationParticipant {
  id: string;
  userId: string;
  user: UserType;
}

interface MessageSeen {
  id: string;
  userId: string;
  user: UserType;
}

interface GroupChatInput {
  name: string;
  participantIds: string[];
}

// Interfaz para los enlaces de invitación a grupos
interface GroupInvitationInput {
  maxUses?: number;
  expiresAt?: string;
  requireEmail?: boolean;
}

// Add a database connection check function
async function checkDatabaseConnection(prisma: PrismaClient) {
  try {
    // Simple query to check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: unknown) {
    console.error('Database connection error:', error);
    return false;
  }
}

export const resolvers = {
  Query: {
    // Get expenses with optional filtering
    expenses: async (_parent: unknown, args: ExpenseArgs, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      
      const where: Record<string, unknown> = {
        paidById: userId
      };

      // Apply filters if provided
      if (args.groupId) {
        where.groupId = args.groupId;
      }

      if (args.categoryId) {
        where.categoryId = args.categoryId;
      }

      if (args.startDate || args.endDate) {
        where.date = {};
        
        if (args.startDate) {
          (where.date as Record<string, Date>).gte = new Date(args.startDate);
        }
        
        if (args.endDate) {
          (where.date as Record<string, Date>).lte = new Date(args.endDate);
        }
      }

      // Get expenses with pagination
      return prisma.expense.findMany({
        where,
        include: {
          paidBy: true,
          group: true,
          category: true,
          shares: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip: args.offset || 0,
        take: args.limit || 10,
      });
    },

    // Get a single expense by ID
    expense: async (_parent: unknown, args: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Get the expense with relations
      const expense = await prisma.expense.findUnique({
        where: { id: args.id },
        include: {
          paidBy: true,
          group: true,
          category: true,
          shares: {
            include: {
              user: true,
            },
          },
        },
      });

      // Ensure the user has access to the expense
      if (
        !expense ||
        (expense.paidById !== userId && 
         (!expense.groupId || 
          !await prisma.groupUser.findFirst({
            where: {
              userId,
              groupId: expense.groupId,
            },
          }))
        )
      ) {
        throw new GraphQLError('Expense not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return expense;
    },

    // Get user's categories
    categories: async (_parent: unknown, _args: unknown, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      return prisma.customCategory.findMany({
        where: { userId },
      });
    },

    // Get groups the user is a member of
    userGroups: async (_parent: unknown, _args: unknown, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        console.error('Authentication failed in userGroups resolver', { context });
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Get userId preferring context.user over session.user for consistency
      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      console.log('Fetching groups for user:', userId);

      // Find groups where the user is a member
      // Define the return type explicitly
      type PrismaGroupUser = {
        id: string;
        userId: string;
        groupId: string;
        role: string;
        group: {
          id: string;
          name: string;
          description: string | null;
          image: string | null;
          members: Array<{
            user: {
              id: string;
              name: string | null;
              email: string;
              image: string | null;
            };
            role: string;
          }>;
        }
      };
      
      const userGroupMemberships = await prisma.groupUser.findMany({
        where: { userId },
        include: { 
          group: {
            include: {
              members: {
                include: {
                  user: true
                }
              }
            }
          }
        },
      }) as PrismaGroupUser[];

      // Return groups with members information
      return userGroupMemberships.map(membership => ({
        ...membership.group,
        members: membership.group.members.map(member => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          role: member.role,
        }))
      }));
    },

    // Get a single group by ID with its members
    group: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is a member of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId: id,
        },
      });

      if (!membership) {
        throw new GraphQLError('Group not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Get the group with its members
      const group = await prisma.group.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!group) {
        throw new GraphQLError('Group not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Define the type for Prisma's GroupUser with nested User
      type PrismaGroupMember = {
        id: string;
        userId: string;
        groupId: string;
        role: string;
        user: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
        };
      };

      // Transform the data to match our schema
      return {
        ...group,
        members: group.members.map((member: PrismaGroupMember) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image,
          role: member.role,
        })),
      };
    },

    // Get all conversations for the current user
    conversations: async (_parent: unknown, _args: unknown, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Find all conversations where the user is a participant
      const participations = await prisma.conversationParticipant.findMany({
        where: { userId },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: true,
                },
              },
              messages: {
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
                include: {
                  sender: true,
                },
              },
              group: true,
            },
          },
        },
      });

      // Use explicit type assertion to resolve the issue
      return participations.map((p: { conversation: unknown }) => p.conversation as unknown as ConversationType);
    },

    // Get a specific conversation by ID
    conversation: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Find the conversation and verify the user is a participant
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: id,
          userId,
        },
      });

      if (!participation) {
        throw new GraphQLError('Conversation not found or not accessible', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return prisma.conversation.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 30,
            include: {
              sender: true,
              seenBy: {
                include: {
                  user: true,
                },
              },
            },
          },
          group: true,
        },
      });
    },

    // Get messages for a conversation
    messages: async (
      _parent: unknown, 
      { conversationId, limit = 50, offset = 0 }: { conversationId: string; limit?: number; offset?: number }, 
      context: Context
    ) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is a participant in the conversation
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (!participation) {
        throw new GraphQLError('Conversation not found or not accessible', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Get messages with pagination, ordered by creation time (newest first)
      return prisma.message.findMany({
        where: { conversationId },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
        include: {
          sender: true,
          seenBy: {
            include: {
              user: true,
            },
          },
        },
      });
    },

    // Verify if an invite token is valid
    verifyInviteToken: async (_parent: unknown, { token }: { token: string }) => {
      try {
        const invitation = await prisma.groupInvitation.findFirst({
          where: {
            token,
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
              }
            },
          },
        });
  
        if (!invitation) {
          throw new GraphQLError('Invalid invite token', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
  
        return {
          id: invitation.id,
          token: invitation.token,
          maxUses: invitation.maxUses,
          usedCount: invitation.useCount,
          expiresAt: invitation.expiresAt,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://splitia.vercel.app'}/join?token=${token}`,
          group: invitation.group,
        };
      } catch (error) {
        console.error('Error verifying invite token:', error);
        throw new GraphQLError('Error verifying invite token', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Get group details from an invite token
    getGroupDetailsFromToken: async (_parent: unknown, { token }: { token: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        // Find the invitation by token
        const invitation = await prisma.groupInvitation.findFirst({
          where: { token },
          include: {
            group: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        });

        if (!invitation || !invitation.group) {
          throw new GraphQLError('Invalid invite token or group not found', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Transform the data to match our schema
        return {
          id: invitation.group.id,
          name: invitation.group.name,
          description: invitation.group.description,
          image: invitation.group.image,
          members: invitation.group.members.map((member: { 
            user: { 
              id: string;
              name: string | null;
              email: string;
              image: string | null;
            };
            role: string;
          }) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image,
            role: member.role,
          })),
        };
      } catch (error) {
        console.error('Error getting group details from token:', error);
        throw new GraphQLError('Error getting group details', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Check if a user exists with the given email
    checkUserExists: async (_parent: unknown, { email }: { email: string }) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        return {
          exists: !!user,
        };
      } catch (error) {
        console.error('Error checking if user exists:', error);
        throw new GraphQLError('Error checking if user exists', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Get group balances
    groupBalances: async (_parent: unknown, { groupId }: { groupId: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is a member of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId,
        },
      });

      if (!membership) {
        throw new GraphQLError('Group not found or access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // Get all group members
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!group) {
          throw new GraphQLError('Group not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Get all expenses for the group
        const expenses = await prisma.expense.findMany({
          where: { groupId },
          include: {
            paidBy: true,
            shares: {
              include: {
                user: true,
              },
            },
          },
        });

        // Default currency (use the first expense's currency or a default)
        const currency = expenses.length > 0 ? expenses[0].currency : 'PEN';

        // Calculate balances
        const balanceMap = new Map<string, { 
          amount: number, 
          name: string, 
          email: string,
          image: string | null 
        }>();

        // Filter out ASSISTANT members and initialize balances for regular members
        group.members.forEach((member: { 
          role: string; 
          userId: string; 
          user: { 
            name: string | null; 
            email: string; 
            image: string | null; 
          }; 
        }) => {
          // Skip AI Assistants and the current user
          if (member.role !== 'ASSISTANT' && member.userId !== userId) {
            balanceMap.set(member.userId, { 
              amount: 0, 
              name: member.user.name || '', 
              email: member.user.email,
              image: member.user.image
            });
          }
        });

        // Process all expenses with explicit typing
        (expenses as Array<{
          paidBy: { id: string };
          shares: Array<{
            user?: { id: string };
            amount: number;
          }>
        }>).forEach(expense => {
          if (!expense.paidBy || !expense.shares) return;
          
          const paidById = expense.paidBy.id;
          
          // Calculate each member's share
          expense.shares.forEach(share => {
            if (share.user) {
              const memberId = share.user.id;
              const shareAmount = share.amount;

              // Skip if it's the current user's share or an ASSISTANT role
              if ((memberId === userId && paidById === userId) || 
                  group.members.some((m: { userId: string; role: string }) => m.userId === memberId && m.role === 'ASSISTANT')) {
                return; // Skip current user's share or AI Assistant
              }

              // If current user paid
              if (paidById === userId && memberId !== userId) {
                const memberBalance = balanceMap.get(memberId);
                if (memberBalance) {
                  // Other member owes current user this share amount
                  memberBalance.amount += shareAmount;
                }
              } 
              // If current user is paying a share
              else if (memberId === userId && paidById !== userId) {
                const payerBalance = balanceMap.get(paidById);
                if (payerBalance) {
                  // Current user owes payer this share amount
                  payerBalance.amount -= shareAmount;
                }
              }
            }
          });
        });

        // Convert the map to an array of balances
        const balances = Array.from(balanceMap.entries()).map(([userId, data]) => ({
          userId,
          name: data.name,
          email: data.email,
          image: data.image,
          amount: data.amount,
          currency,
        }));

        // Calculate summary values
        const totalOwed = balances
          .filter(b => b.amount > 0)
          .reduce((sum, b) => sum + b.amount, 0);
        
        const totalOwing = balances
          .filter(b => b.amount < 0)
          .reduce((sum, b) => sum + b.amount, 0);

        return {
          totalOwed,
          totalOwing: Math.abs(totalOwing), // Make it positive for the client
          netBalance: totalOwed + totalOwing,
          currency,
          balances,
        };
      } catch (error) {
        console.error('Error calculating group balances:', error);
        throw new GraphQLError('Failed to calculate group balances', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Get settlements with optional filtering
    settlements: async (_parent: unknown, args: { groupId: string, userId?: string, status?: SettlementStatus }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      
      // Check if user is a member of the group
      const userInGroup = await prisma.groupUser.findFirst({
        where: {
          userId: userId,
          groupId: args.groupId
        }
      });
      
      if (!userInGroup) {
        throw new GraphQLError('User is not a member of this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Create a type-safe where clause for Prisma
      // Using Record to create a more flexible type without resorting to 'any'
      const searchParams: Record<string, unknown> = {
        groupId: args.groupId,
        OR: [
          { initiatedById: userId },
          { settledWithUserId: userId }
        ]
      };
      
      // Update OR filter if userId provided
      if (args.userId) {
        searchParams.OR = [
          { initiatedById: args.userId },
          { settledWithUserId: args.userId }
        ];
      }
      
      // Add status filter if provided using Prisma's direct enum assignment
      if (args.status) {
        searchParams.settlementStatus = args.status;
      }
      
      // Query settlements
      return prisma.settlement.findMany({
        where: searchParams,
        include: {
          initiatedBy: true,
          settledWithUser: true,
          group: true
        },
        orderBy: {
          date: 'desc'
        }
      });
    },
  },

  Mutation: {
    // Create a new expense
    createExpense: async (_parent: unknown, { data }: { data: ExpenseInput }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // If this is a group expense, verify user is in the group
      if (data.groupId) {
        const membership = await prisma.groupUser.findFirst({
          where: {
            userId,
            groupId: data.groupId,
          },
        });

        if (!membership) {
          throw new GraphQLError('You are not a member of this group', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
      }

      // If this is a settlement, handle it differently
      if (data.isSettlement && data.settlementType && data.settlementStatus && data.settledWithUserId) {
        // Create settlement
        const settlementInput: SettlementInput = {
          amount: data.amount,
          description: data.description,
          groupId: data.groupId!,
          toUserId: data.settledWithUserId,
          type: data.settlementType || SettlementType.PAYMENT,
        };
        
        const settlement = await resolvers.Mutation.createSettlement(
          _parent, 
          settlementInput, 
          context
        );
        
        // Get the created expense that's linked to the settlement
        const expense = await prisma.expense.findFirst({
          where: { 
            settlementId: settlement.settlement ? settlement.settlement.id : undefined 
          },
          include: {
            paidBy: true,
            group: true,
            category: true,
            shares: {
              include: {
                user: true
              }
            },
            settlement: {
              include: {
                initiatedBy: true,
                settledWithUser: true,
                group: true
              }
            }
          }
        });
        
        if (!expense) {
          throw new GraphQLError('Failed to create expense for settlement', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
        
        return expense;
      }

    },

    // Update an existing expense
    updateExpense: async (_parent: unknown, { data }: { data: ExpenseInput }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      if (!data.id) {
        throw new GraphQLError('Expense ID is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Find the existing expense
      const existingExpense = await prisma.expense.findUnique({
        where: { id: data.id },
        include: {
          shares: true,
        },
      });

      if (!existingExpense) {
        throw new GraphQLError('Expense not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user has permission to update this expense
      if (existingExpense.paidById !== userId) {
        // If it's a group expense, check if user is an admin
        if (existingExpense.groupId) {
          const membership = await prisma.groupUser.findFirst({
            where: {
              userId,
              groupId: existingExpense.groupId,
              role: GroupRole.ADMIN,
            },
          });

          if (!membership) {
            throw new GraphQLError('You do not have permission to update this expense', {
              extensions: { code: 'FORBIDDEN' },
            });
          }
        } else {
          throw new GraphQLError('You do not have permission to update this expense', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
      }

      // Update expense and shares in a transaction
      return prisma.$transaction(async (tx: TransactionClient) => {
        // Update the expense
        await tx.expense.update({
          where: { id: data.id },
          data: {
            amount: data.amount !== undefined ? data.amount : undefined,
            description: data.description !== undefined ? data.description : undefined,
            date: data.date !== undefined ? new Date(data.date) : undefined,
            categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
            currency: data.currency !== undefined ? data.currency : undefined,
            location: data.location !== undefined ? data.location : undefined,
            notes: data.notes !== undefined ? data.notes : undefined,
            groupId: data.groupId !== undefined ? data.groupId : undefined,
          },
        });

        // Update shares if provided
        if (data.shares && data.shares.length > 0) {
          // Delete existing shares
          await tx.expenseShare.deleteMany({
            where: { expenseId: data.id },
          });

          // Create new shares
          await Promise.all(
            data.shares.map((share: ExpenseShareInput) =>
              tx.expenseShare.create({
                data: {
                  amount: share.amount,
                  type: share.type as ShareType,
                  userId: share.userId,
                  expenseId: data.id!,
                },
              })
            )
          );
        }

        // Get the complete updated expense with shares
        return tx.expense.findUnique({
          where: { id: data.id },
          include: {
            paidBy: true,
            group: true,
            category: true,
            shares: {
              include: {
                user: true,
              },
            },
          },
        });
      }, { timeout: 10000 });
    },

    // Delete an expense
    deleteExpense: async (_parent: unknown, args: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Find the expense
      const expense = await prisma.expense.findUnique({
        where: { id: args.id },
      });

      if (!expense) {
        throw new GraphQLError('Expense not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if user has permission to delete this expense
      if (expense.paidById !== userId) {
        // If it's a group expense, check if user is an admin
        if (expense.groupId) {
          const membership = await prisma.groupUser.findFirst({
            where: {
              userId,
              groupId: expense.groupId,
              role: GroupRole.ADMIN,
            },
          });

          if (!membership) {
            throw new GraphQLError('You do not have permission to delete this expense', {
              extensions: { code: 'FORBIDDEN' },
            });
          }
        } else {
          throw new GraphQLError('You do not have permission to delete this expense', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
      }

      // Delete expense shares and the expense in a transaction
      await prisma.$transaction([
        prisma.expenseShare.deleteMany({
          where: { expenseId: args.id },
        }),
        prisma.expense.delete({
          where: { id: args.id },
        }),
      ]);

      return true;
    },

    // Create a new custom category
    createCategory: async (_parent: unknown, args: CategoryInput, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Check if category with this name already exists for the user
      const existingCategory = await prisma.customCategory.findFirst({
        where: {
          userId,
          name: args.name,
        },
      });

      if (existingCategory) {
        throw new GraphQLError('A category with this name already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Create the category
      return prisma.customCategory.create({
        data: {
          name: args.name,
          icon: args.icon || null,
          color: args.color || null,
          userId,
        },
      });
    },

    // Create a new group with an automatic chat conversation
    createGroup: async (_parent: unknown, { data }: { data: GroupInput }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      console.log('Creating group with Prisma user ID:', userId);

      // Use the new utility to create a group with a conversation
      const group = await createGroupWithConversation(userId, {
        name: data.name,
        description: data.description || undefined,
        image: data.image || undefined
      });

      // Assert the group has the expected structure
      if (!group || typeof group !== 'object' || !('name' in group) || !('conversationId' in group)) {
        throw new GraphQLError('Failed to create group', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Add a welcome message
      await prisma.message.create({
        data: {
          content: `Welcome to the ${group.name} group chat!`,
          conversationId: group.conversationId as string,
          senderId: userId,
          isAI: true,
        },
      });

      return group;
    },

    // Add a member to a group and to the group's conversation
    addGroupMember: async (_parent: unknown, 
      { groupId, data }: { groupId: string; data: GroupMemberInput }, 
      context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is an admin of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId,
          role: GroupRole.ADMIN,
        },
      });

      if (!membership) {
        throw new GraphQLError('Not authorized to add members to this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Find the user to add by email
      const userToAdd = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!userToAdd) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check if the user is already a member
      const existingMembership = await prisma.groupUser.findFirst({
        where: {
          userId: userToAdd.id,
          groupId,
        },
      });

      if (existingMembership) {
        throw new GraphQLError('User is already a member of this group', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Use our utility function to add the user to both the group and conversation
      await addUserToGroupAndConversation(groupId, userToAdd.id, data.role as GroupRole);

      // Add a notification message
      const group = await prisma.group.findUnique({
        where: { id: groupId },
      });

      if (group) {
        await prisma.message.create({
          data: {
            content: `${userToAdd.name || userToAdd.email} has joined the group.`,
            conversationId: group.conversationId as string,
            senderId: userId,
            isAI: true,
          },
        });
      }

      return true;
    },

    // Remove a member from a group and from the group's conversation
    removeGroupMember: async (_parent: unknown, 
      { groupId, userId: memberIdToRemove }: { groupId: string; userId: string }, 
      context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is an admin of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId,
          role: GroupRole.ADMIN,
        },
      });

      if (!membership) {
        throw new GraphQLError('Not authorized to remove members from this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check if the user to remove is a member
      const membershipToRemove = await prisma.groupUser.findFirst({
        where: {
          userId: memberIdToRemove,
          groupId,
        },
      });

      if (!membershipToRemove) {
        throw new GraphQLError('User is not a member of this group', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Don't allow removing the last admin
      if (membershipToRemove.role === GroupRole.ADMIN) {
        const adminCount = await prisma.groupUser.count({
          where: {
            groupId,
            role: GroupRole.ADMIN,
          },
        });

        if (adminCount <= 1) {
          throw new GraphQLError('Cannot remove the last admin of the group', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
      }

      // Get user info for notification message
      const userToRemove = await prisma.user.findUnique({
        where: { id: memberIdToRemove },
      });

      // Remove the user from the group and from the group's conversation in a transaction
      await prisma.$transaction(async (tx: TransactionClient) => {
        // Remove the user from the group
        await tx.groupUser.delete({
          where: {
            id: membershipToRemove.id,
          },
        });

        // Find the group's conversation
        const conversation = await tx.conversation.findUnique({
          where: { groupId },
          include: {
            participants: {
              where: {
                userId: memberIdToRemove,
              },
            },
          },
        });

        if (conversation && conversation.participants.length > 0) {
          // Remove the user from the conversation
          await tx.conversationParticipant.delete({
            where: {
              id: conversation.participants[0].id,
            },
          });

          // Add a notification message
          if (userToRemove) {
            await tx.message.create({
              data: {
                content: `${userToRemove.name || userToRemove.email} has been removed from the group.`,
                conversationId: conversation.id,
                senderId: userId,
                isAI: true,
              },
            });
          }
        }
      });

      return true;
    },

    // Leave a group
    leaveGroup: async (_parent: unknown, { groupId }: { groupId: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Check if the user is a member
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId,
        },
      });

      if (!membership) {
        throw new GraphQLError('You are not a member of this group', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Don't allow leaving if the user is the last admin
      if (membership.role === GroupRole.ADMIN) {
        const adminCount = await prisma.groupUser.count({
          where: {
            groupId,
            role: GroupRole.ADMIN,
          },
        });

        if (adminCount <= 1) {
          throw new GraphQLError('Cannot leave the group as the last admin. Transfer ownership or delete the group.', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
      }

      // Remove the user from the group
      await prisma.groupUser.delete({
        where: {
          id: membership.id,
        },
      });

      return true;
    },

    // Delete a group
    deleteGroup: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is an admin of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId: id,
          role: GroupRole.ADMIN,
        },
      });

      if (!membership) {
        throw new GraphQLError('Not authorized to delete this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Delete the group in a transaction, cascading to memberships
      await prisma.$transaction(async (tx: TransactionClient) => {
        // Delete all group memberships
        await tx.groupUser.deleteMany({
          where: { groupId: id },
        });

        // Delete the group
        await tx.group.delete({
          where: { id },
        });
      });

      return true;
    },

    // Create a new conversation
    createConversation: async (
      _parent: unknown, 
      { participantIds }: { participantIds: string[] }, 
      context: Context
    ) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Make sure the current user is included in the participants
      const allParticipantIds = new Set([userId, ...participantIds]);
      
      // Check if all participants exist
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: Array.from(allParticipantIds),
          },
        },
      });

      if (users.length !== allParticipantIds.size) {
        throw new GraphQLError('One or more participants do not exist', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // For direct messages (2 participants), check if a conversation already exists
      if (allParticipantIds.size === 2) {
        const existingConversations = await prisma.conversation.findMany({
          where: {
            isGroupChat: false,
            participants: {
              every: {
                userId: {
                  in: Array.from(allParticipantIds),
                },
              },
            },
          },
          include: {
            participants: {
              include: {
                user: true,
              },
            },
          },
        });

        // Filter to find a conversation with exactly the requested participants
        const exactConversation = existingConversations.find((c: { participants: { userId: string }[] }) => 
          c.participants.length === allParticipantIds.size &&
          c.participants.every((p: { userId: string }) => allParticipantIds.has(p.userId))
        );

        if (exactConversation) {
          return exactConversation;
        }
      }

      // Create a new conversation with the participants
      return prisma.conversation.create({
        data: {
          isGroupChat: allParticipantIds.size > 2,
          participants: {
            create: Array.from(allParticipantIds).map(id => ({
              userId: id,
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    },

    // Send a message in a conversation
    sendMessage: async (
      _parent: unknown, 
      { data }: { data: MessageInput }, 
      context: Context
    ) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is a participant in the conversation
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: data.conversationId,
          userId,
        },
      });

      if (!participation) {
        throw new GraphQLError('Conversation not found or not accessible', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Create the message
      return prisma.message.create({
        data: {
          content: data.content,
          conversationId: data.conversationId,
          senderId: userId,
          seenBy: {
            create: {
              userId, // The sender has seen the message
            },
          },
        },
        include: {
          sender: true,
          seenBy: {
            include: {
              user: true,
            },
          },
        },
      });
    },

    // Mark a message as seen
    markMessageAsSeen: async (
      _parent: unknown, 
      { messageId }: { messageId: string }, 
      context: Context
    ) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Get the message and check if it exists
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          seenBy: true,
        },
      });

      if (!message) {
        throw new GraphQLError('Message not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verify the user is a participant in the conversation
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId: message.conversationId,
          userId,
        },
      });

      if (!participation) {
        throw new GraphQLError('Not authorized to access this message', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Check if the user has already seen the message
      const alreadySeen = message.seenBy.some((seen: { userId: string }) => seen.userId === userId);
      if (alreadySeen) {
        return true; // Already marked as seen
      }

      // Mark the message as seen
      await prisma.messageSeen.create({
        data: {
          messageId,
          userId,
        },
      });

      return true;
    },

    // Create a new group chat directly
    createGroupChat: async (_parent: unknown, 
      { data }: { data: GroupChatInput }, 
      context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      if (!data.participantIds || data.participantIds.length === 0) {
        throw new GraphQLError('At least one participant is required', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Check if all participants exist
      const participants = await prisma.user.findMany({
        where: {
          id: {
            in: data.participantIds
          }
        }
      });

      if (participants.length !== data.participantIds.length) {
        throw new GraphQLError('One or more participants not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      try {
        const result = await createGroupChatWithGroup(userId, {
          name: data.name,
          participantIds: data.participantIds
        });
        
        // Assert the result has the expected structure
        if (!result || typeof result !== 'object' || !('conversation' in result)) {
          throw new GraphQLError('Failed to create group chat', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        const conversation = result.conversation as { id: string };

        // Add a welcome message
        await prisma.message.create({
          data: {
            content: `Welcome to ${data.name} group chat!`,
            conversationId: conversation.id,
            senderId: userId,
            isAI: true,
          },
        });

        return conversation;
      } catch (error) {
        console.error('Error creating group chat:', error);
        throw new GraphQLError('Failed to create group chat', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Join a group using an invitation token
    joinGroupByToken: async (
      _parent: unknown,
      { token, email }: { token: string; email?: string },
      context: Context
    ) => {
      try {
        // Identify the user - either from context or by provided email
        let userId: string | undefined;
        let userEmail: string | undefined;
        
        const session = await getServerSession(context);
        
        if (session?.user) {
          userId = context.user?.id || session.user.id;
          if (!userId) {
            throw new GraphQLError('User ID not found in session', {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
          }
          
          // Get the user's email for notification
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          
          userEmail = user?.email;
        } else if (email) {
          // If no session but email provided, find or create user
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (user) {
            userId = user.id;
            userEmail = user.email;
          } else {
            throw new GraphQLError('User not found. Please sign up first.', {
              extensions: { code: 'BAD_REQUEST' },
            });
          }
        } else {
          throw new GraphQLError('Authentication required', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }
        
        // Find the invitation by token
        const invitation = await prisma.groupInvitation.findUnique({
          where: { token },
          include: {
            group: true,
          },
        });

        if (!invitation) {
          return {
            success: false,
            message: 'Invalid invitation token',
          };
        }

        // Check if the invitation has expired
        if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
          return {
            success: false,
            message: 'Invitation has expired',
          };
        }

        // Check if the invitation has reached maximum uses
        if (invitation.maxUses && invitation.useCount >= invitation.maxUses) {
          return {
            success: false,
            message: 'Invitation has reached maximum number of uses',
          };
        }

        // Check if the user is already a member of the group
        const existingMembership = await prisma.groupUser.findFirst({
          where: {
            userId,
            groupId: invitation.groupId,
          },
        });

        if (existingMembership) {
          return {
            success: false,
            message: 'You are already a member of this group',
            group: invitation.group,
          };
        }

        // Add the user to the group with MEMBER role
        await prisma.$transaction(async (tx: TransactionClient) => {
          // Add user to the group
          await tx.groupUser.create({
            data: {
              role: 'MEMBER',
              userId,
              groupId: invitation.groupId,
            },
          });

          // Add user to the group's conversation if it exists
          if (invitation.group.conversationId) {
            await tx.conversationParticipant.create({
              data: {
                userId,
                conversationId: invitation.group.conversationId,
              },
            });

            // Add a notification message
            await tx.message.create({
              data: {
                content: `${userEmail || 'A new user'} has joined the group.`,
                conversationId: invitation.group.conversationId,
                senderId: userId,
                isAI: true,
              },
            });
          }

          // Update invitation usage count
          await tx.groupInvitation.update({
            where: { id: invitation.id },
            data: {
              useCount: {
                increment: 1,
              },
              usedAt: invitation.usedAt || new Date(), // Update usedAt if it's the first use
            },
          });
        });

        return {
          success: true,
          message: 'Successfully joined the group',
          group: invitation.group,
        };
      } catch (error) {
        console.error('Error joining group by token:', error);
        return {
          success: false,
          message: error instanceof GraphQLError ? error.message : 'An error occurred while joining the group',
        };
      }
    },

    // Create a group invitation link
    createGroupInvitation: async (_parent: unknown,
      { groupId, data }: { groupId: string; data: GroupInvitationInput },
      context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Verify the user is a member of the group
      const membership = await prisma.groupUser.findFirst({
        where: {
          userId,
          groupId,
        },
      });

      if (!membership) {
        throw new GraphQLError('Not authorized to create invitation links for this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // Generate a unique token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Create invitation link in database
        const invitation = await prisma.groupInvitation.create({
          data: {
            token,
            maxUses: data.maxUses || null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            group: {
              connect: {
                id: groupId
              }
            },
            creator: {
              connect: {
                id: userId
              }
            },
            // Almacenar requireEmail como metadato o en un campo específico si existe
            // Aquí asumimos que no hay un campo específico en el modelo
          }
        });

        // Construir la URL completa para el enlace de invitación
        const baseUrl = 'https://splitia.vercel.app';
        const url = `${baseUrl}/join?token=${token}${data.requireEmail ? '&requireEmail=true' : ''}`;

        return {
          ...invitation,
          url,
          usedCount: 0
        };
      } catch (error) {
        console.error('Error creating group invitation link:', error);
        throw new GraphQLError('Failed to create invitation link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    deleteConversation: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      
      try {
        // Verificar que la conversación existe y el usuario es parte de ella
        const conversation = await prisma.conversation.findFirst({
          where: {
            id,
            participants: {
              some: {
                userId
              }
            }
          }
        });
        
        if (!conversation) {
          throw new GraphQLError('Conversation not found or you do not have permission', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        
        // Eliminar todos los mensajes relacionados con la conversación
        await prisma.message.deleteMany({
          where: {
            conversationId: id
          }
        });
        
        // Eliminar los participantes de la conversación
        await prisma.conversationParticipant.deleteMany({
          where: {
            conversationId: id
          }
        });
        
        // Finalmente eliminar la conversación
        await prisma.conversation.delete({
          where: {
            id
          }
        });
        
        return true;
      } catch (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }
    },

    // Record a payment between group members
    recordPayment: async (
      _parent: unknown,
      { 
        groupId, 
        userId: otherUserId, 
        amount, 
        currency, 
        method 
      }: { 
        groupId: string; 
        userId: string; 
        amount: number; 
        currency: string; 
        method: string;
      },
      context: Context
    ) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const currentUserId = context.user?.id || session.user.id;
      if (!currentUserId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      try {
        // Verify both users are members of the group
        const memberships = await prisma.groupUser.findMany({
          where: {
            groupId,
            userId: {
              in: [currentUserId, otherUserId]
            }
          }
        });

        if (memberships.length !== 2) {
          throw new GraphQLError('One or both users are not members of this group', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
        
        // Verify that none of the users is an AI Assistant
        const assistantMembership = memberships.find((m: { role: string }) => m.role === 'ASSISTANT');
        if (assistantMembership) {
          throw new GraphQLError('Cannot record payments for AI Assistant users', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }

        // Get the group to create a payment record
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          select: { 
            name: true,
            conversationId: true
          }
        });

        if (!group) {
          throw new GraphQLError('Group not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Get the other user's info to include in the notification
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { name: true, email: true }
        });

        if (!otherUser) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Create a "settlement" expense to record the payment
        await prisma.expense.create({
          data: {
            amount,
            description: `Payment to settle balance - ${method}`,
            date: new Date(),
            currency,
            paidById: currentUserId,
            groupId,
            // Create a share for the recipient
            shares: {
              create: {
                amount,
                type: 'FIXED',
                userId: otherUserId
              }
            }
          }
        });

        // Add a notification in the group chat if it exists
        if (group.conversationId) {
          await prisma.message.create({
            data: {
              content: `${session.user.email || 'A user'} paid ${formatCurrency(amount, currency)} to ${otherUser.name || otherUser.email} via ${method}.`,
              conversationId: group.conversationId,
              senderId: currentUserId,
              isAI: true
            }
          });
        }

        return true;
      } catch (error) {
        console.error('Error recording payment:', error);
        throw new GraphQLError('Failed to record payment', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Create a new settlement
    createSettlement: async (_parent: unknown, args: SettlementInput, context: Context) => {
      try {
        const session = await getServerSession(context);
        
        if (!session?.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const userId = context.user?.id || session.user.id;
        if (!userId) {
          throw new GraphQLError('User ID not found in session', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        // Check if database is accessible
        const isDatabaseConnected = await checkDatabaseConnection(prisma);
        if (!isDatabaseConnected) {
          throw new GraphQLError('Database connection error', {
            extensions: { code: 'DATABASE_ERROR' },
          });
        }

        // Check if user is a member of the group
        const isGroupMember = await prisma.groupUser.findFirst({
          where: {
            userId,
            groupId: args.groupId,
          },
        });

        if (!isGroupMember) {
          throw new GraphQLError('User is not a member of this group', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Create the settlement
        const settlement = await prisma.settlement.create({
          data: {
            amount: args.amount,
            description: args.description,
            settledWithUser: {
              connect: { id: args.toUserId }
            },
            initiatedBy: {
              connect: { id: userId }
            },
            group: {
              connect: { id: args.groupId }
            },
            settlementStatus: SettlementStatus.PENDING,
            settlementType: args.type ?? SettlementType.PAYMENT,
            date: new Date(),
          },
          include: {
            initiatedBy: true,
            settledWithUser: true,
            group: true,
          },
        });

        return {
          success: true,
          message: 'Settlement created successfully',
          settlement,
        };
      } catch (error: unknown) {
        console.error('Error creating settlement:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to create settlement', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    // Update settlement status
    updateSettlementStatus: async (_parent: unknown, args: { id: string; status: SettlementStatus }, context: Context) => {
      try {
        const session = await getServerSession(context);
        
        if (!session?.user) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const userId = context.user?.id || session.user.id;
        if (!userId) {
          throw new GraphQLError('User ID not found in session', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }

        // Check if database is accessible
        const isDatabaseConnected = await checkDatabaseConnection(prisma);
        if (!isDatabaseConnected) {
          throw new GraphQLError('Database connection error', {
            extensions: { code: 'DATABASE_ERROR' },
          });
        }

        // Get the settlement
        const settlement = await prisma.settlement.findUnique({
          where: { id: args.id },
        });

        if (!settlement) {
          throw new GraphQLError('Settlement not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        // Only the recipient (toUser) can mark a settlement as COMPLETED
        if (args.status === SettlementStatus.COMPLETED && settlement.settledWithUserId !== userId) {
          throw new GraphQLError('Only the recipient can mark a settlement as completed', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Only the sender (fromUser) can mark a settlement as CANCELLED
        if (args.status === SettlementStatus.CANCELLED && settlement.initiatedById !== userId) {
          throw new GraphQLError('Only the sender can cancel a settlement', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        // Update the settlement status
        const updatedSettlement = await prisma.settlement.update({
          where: { id: args.id },
          data: { 
            settlementStatus: args.status as SettlementStatus
          },
          include: {
            initiatedBy: true,
            settledWithUser: true,
            group: true,
          },
        });

        return {
          success: true,
          message: `Settlement ${args.status.toLowerCase()} successfully`,
          settlement: updatedSettlement,
        };
      } catch (error: unknown) {
        console.error('Error updating settlement status:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError('Failed to update settlement status', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    
    // Confirm a settlement (only the counterparty can confirm)
    confirmSettlement: async (_parent: unknown, { settlementId }: { settlementId: string }, context: Context) => {
      const session = await getServerSession(context);
      
      if (!session?.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user?.id || session.user.id;
      if (!userId) {
        throw new GraphQLError('User ID not found in session', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      
      // Get the settlement
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
      });
      
      if (!settlement) {
        throw new GraphQLError('Settlement not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }
      
      // Determine if user can confirm (only the counterparty, not the initiator)
      const canConfirm = 
        (settlement.settlementStatus === SettlementStatus.PENDING_CONFIRMATION) && 
        (
          (settlement.initiatedById === userId && settlement.settlementType === SettlementType.RECEIPT) ||
          (settlement.settledWithUserId === userId && settlement.settlementType === SettlementType.PAYMENT)
        );
      
      if (!canConfirm) {
        throw new GraphQLError('User cannot confirm this settlement', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      // Update the settlement to confirmed status
      return prisma.settlement.update({
        where: { id: settlementId },
        data: { 
          settlementStatus: 'CONFIRMED' as const 
        },
        include: {
          initiatedBy: true,
          settledWithUser: true,
          group: true
        }
      });
    },
  },

  // Type resolvers for nested fields
  Expense: {
    shares: async (parent: ExpenseType) => {
      if (parent.shares) return parent.shares;

      return prisma.expenseShare.findMany({
        where: { expenseId: parent.id },
        include: {
          user: true,
        },
      });
    },
    paidBy: async (parent: ExpenseType) => {
      if (parent.paidBy) return parent.paidBy;

      return prisma.user.findUnique({
        where: { id: parent.paidById },
      });
    },
    group: async (parent: ExpenseType) => {
      if (!parent.groupId) return null;
      if (parent.group) return parent.group;

      return prisma.group.findUnique({
        where: { id: parent.groupId },
      });
    },
    category: async (parent: ExpenseType) => {
      if (!parent.categoryId) return null;
      if (parent.category) return parent.category;

      return prisma.customCategory.findUnique({
        where: { id: parent.categoryId },
      });
    },
    settlement: async (parent: ExpenseType) => {
      if (!parent.settlementId) return null;
      if (parent.settlement) return parent.settlement;
      
      return prisma.settlement.findUnique({
        where: { id: parent.settlementId },
        include: {
          initiatedBy: true,
          settledWithUser: true,
          group: true
        }
      });
    }
  },

  ExpenseShare: {
    user: async (parent: ExpenseShareType) => {
      if (parent.user) return parent.user;

      return prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },

  Group: {
    createdBy: async (parent: { id: string; createdById?: string }) => {
      if (!parent.createdById) return null;
      
      return prisma.user.findUnique({
        where: { id: parent.createdById },
      });
    },
    conversation: async (parent: { id: string }) => {
      return prisma.conversation.findUnique({
        where: { groupId: parent.id },
      });
    },
  },

  Conversation: {
    participants: async (parent: ConversationType) => {
      if (parent.participants) {
        return parent.participants.map(p => p.user);
      }

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: parent.id },
        include: {
          user: true,
        },
      });

      return participants.map((p: ConversationParticipant) => p.user);
    },
    messages: async (parent: ConversationType) => {
      if (parent.messages) return parent.messages;

      return prisma.message.findMany({
        where: { conversationId: parent.id },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
        include: {
          sender: true,
          seenBy: {
            include: {
              user: true,
            },
          },
        },
      });
    },
    group: async (parent: ConversationType) => {
      if (!parent.groupId) return null;
      if (parent.group) return parent.group;

      return prisma.group.findUnique({
        where: { id: parent.groupId },
      });
    },
  },

  Message: {
    sender: async (parent: MessageType) => {
      if (parent.sender) return parent.sender;

      return prisma.user.findUnique({
        where: { id: parent.senderId },
      });
    },
    seenBy: async (parent: MessageType) => {
      if (parent.seenBy) {
        return parent.seenBy.map((seen: { user: UserType }) => seen.user);
      }

      const seen = await prisma.messageSeen.findMany({
        where: { messageId: parent.id },
        include: {
          user: true,
        },
      });

      return seen.map((s: MessageSeen) => s.user);
    },
  },

  // Add resolver for Settlement type
  Settlement: {
    initiatedBy: async (parent: SettlementData) => {
      if (parent.initiatedBy) return parent.initiatedBy;
      
      return prisma.user.findUnique({
        where: { id: parent.initiatedById }
      });
    },
    
    settledWithUser: async (parent: SettlementData) => {
      if (parent.settledWithUser) return parent.settledWithUser;
      
      return prisma.user.findUnique({
        where: { id: parent.settledWithUserId }
      });
    },
    
    group: async (parent: SettlementData) => {
      if (parent.group) return parent.group;
      
      return prisma.group.findUnique({
        where: { id: parent.groupId }
      });
    }
  },
};

// Helper function to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency || 'PEN'
  }).format(amount);
} 