import { prisma } from '@/lib/prisma';
import { GraphQLError } from 'graphql';

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

// Basic type definitions for resolvers
interface Context {
  user?: {
    id: string;       // This is now the Prisma User ID
    email: string;
    externalId?: string; // This is the Supabase User ID
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
  shares?: ExpenseShareInput[];
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

// NOTE: We've replaced this with more specific types in resolver functions
// interface GroupUserType {
//   id: string;
//   userId: string; 
//   groupId: string;
//   role: string;
//   user: UserType;
//   group: GroupType;
// }

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
        }
      };
      
      const userGroupMemberships = await prisma.groupUser.findMany({
        where: { userId },
        include: { group: true },
      }) as PrismaGroupUser[];

      // Return just the groups
      return userGroupMemberships.map(membership => membership.group);
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

      // Create the expense and expense shares in a transaction
      return prisma.$transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (tx: any) => {
          // Type the transaction parameter properly
          const txClient = tx as typeof prisma;
          
          // Create the expense
          const expense = await txClient.expense.create({
            data: {
              amount: data.amount,
              description: data.description,
              date: new Date(data.date),
              categoryId: data.categoryId || null,
              currency: data.currency,
              location: data.location || null,
              notes: data.notes || null,
              paidById: userId,
              groupId: data.groupId || null,
            },
            include: {
              paidBy: true,
              group: true,
              category: true,
            },
          });

          // Create expense shares if provided
          if (data.shares && data.shares.length > 0) {
            await Promise.all(
              data.shares.map((share: ExpenseShareInput) =>
                txClient.expenseShare.create({
                  data: {
                    amount: share.amount,
                    type: share.type as ShareType,
                    userId: share.userId,
                    expenseId: expense.id,
                  },
                })
              )
            );
          } else if (data.groupId) {
            // If it's a group expense but no shares provided, 
            // create equal shares for all group members
            const groupMembers = await txClient.groupUser.findMany({
              where: { groupId: data.groupId },
              select: { userId: true },
            });

            const shareAmount = data.amount / groupMembers.length;

            await Promise.all(
              groupMembers.map((member: { userId: string }) =>
                txClient.expenseShare.create({
                  data: {
                    amount: shareAmount,
                    type: ShareType.EQUAL,
                    userId: member.userId,
                    expenseId: expense.id,
                  },
                })
              )
            );
          } else {
            // For personal expenses, create a share for the user
            await txClient.expenseShare.create({
              data: {
                amount: data.amount,
                type: ShareType.FIXED,
                userId,
                expenseId: expense.id,
              },
            });
          }

          // Get the complete expense with shares
          return txClient.expense.findUnique({
            where: { id: expense.id },
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
        }
      );
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
              role: 'ADMIN',
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
      return prisma.$transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (tx: any) => {
          // Type the transaction parameter properly
          const txClient = tx as typeof prisma;
          
          // Update the expense
          await txClient.expense.update({
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
            await txClient.expenseShare.deleteMany({
              where: { expenseId: data.id },
            });

            // Create new shares
            await Promise.all(
              data.shares.map((share: ExpenseShareInput) =>
                txClient.expenseShare.create({
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
          return txClient.expense.findUnique({
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
        }
      );
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
              role: 'ADMIN',
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

    // Create a new group
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

      // Create the group and add the creator as an admin in a transaction
      return prisma.$transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (tx: any) => {
          // Type the transaction parameter properly
          const txClient = tx as typeof prisma;
          
          // Create the group
          const group = await txClient.group.create({
            data: {
              name: data.name,
              description: data.description || null,
              image: data.image || null,
              createdById: userId,
            },
          });

          // Add the creator as an admin
          await txClient.groupUser.create({
            data: {
              userId,
              groupId: group.id,
              role: 'ADMIN',
            },
          });

          return group;
        }
      );
    },

    // Add a member to a group
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
          role: 'ADMIN',
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

      // Add the user to the group
      await prisma.groupUser.create({
        data: {
          userId: userToAdd.id,
          groupId,
          role: data.role,
        },
      });

      return true;
    },

    // Remove a member from a group
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
          role: 'ADMIN',
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
      if (membershipToRemove.role === 'ADMIN') {
        const adminCount = await prisma.groupUser.count({
          where: {
            groupId,
            role: 'ADMIN',
          },
        });

        if (adminCount <= 1) {
          throw new GraphQLError('Cannot remove the last admin of the group', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
      }

      // Remove the user from the group
      await prisma.groupUser.delete({
        where: {
          id: membershipToRemove.id,
        },
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
      if (membership.role === 'ADMIN') {
        const adminCount = await prisma.groupUser.count({
          where: {
            groupId,
            role: 'ADMIN',
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
          role: 'ADMIN',
        },
      });

      if (!membership) {
        throw new GraphQLError('Not authorized to delete this group', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Delete the group in a transaction, cascading to memberships
      await prisma.$transaction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (tx: any) => {
          // Type the transaction parameter properly
          const txClient = tx as typeof prisma;
          
          // Delete all group memberships
          await txClient.groupUser.deleteMany({
            where: { groupId: id },
          });

          // Delete the group
          await txClient.group.delete({
            where: { id },
          });
        }
      );

      return true;
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
  },
}; 