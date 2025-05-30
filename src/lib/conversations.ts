import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

// Define our own GroupRole enum to match the Prisma schema
enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
  ASSISTANT = 'ASSISTANT'
}

// Common type for transaction callback parameters
type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

// At the top of the file, add these types
interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface GroupMember {
  user: User;
  role: string;
}

/**
 * Creates a new group with an associated conversation
 */
export async function createGroupWithConversation(
  userId: string,
  groupData: {
    name: string;
    description?: string;
    image?: string;
  }
) {
  try {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      console.log('Creating conversation...');
      // Create the conversation first
      const conversation = await tx.conversation.create({
        data: {
          isGroupChat: true,
          name: groupData.name // Add name to conversation
        }
      });
      console.log('Conversation created:', conversation);

      console.log('Creating group...');
      // Create the group with the conversation reference
      const group = await tx.group.create({
        data: {
          name: groupData.name,
          description: groupData.description,
          image: groupData.image,
          conversationId: conversation.id,
          createdById: userId,
          members: {
            create: {
              userId: userId,
              role: 'ADMIN' as GroupRole
            }
          }
        },
        include: {
          members: {
            include: {
              user: true
            }
          },
          conversation: true
        }
      });
      console.log('Group created:', group);

      console.log('Updating conversation with group reference...');
      // Update the conversation with the group reference
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { groupId: group.id }
      });

      console.log('Adding group creator as conversation participant...');
      // Add group creator as conversation participant
      await tx.conversationParticipant.create({
        data: {
          conversationId: conversation.id,
          userId: userId
        }
      });

      // Transform the group data to match the GraphQL schema
      return {
        ...group,
        members: group.members.map((member: GroupMember) => ({
          id: member.user.id,
          name: member.user.name || '',  // Ensure name is never null
          email: member.user.email,
          image: member.user.image,
          role: member.role
        }))
      };
    });
  } catch (error) {
    console.error('Error in createGroupWithConversation:', error);
    throw error;
  }
}

/**
 * Creates a group chat conversation and an associated group
 */
export async function createGroupChatWithGroup(
  userId: string,
  conversationData: {
    name: string;
    participantIds: string[];
  }
) {
  return await prisma.$transaction(async (tx: TransactionClient) => {
    // Create the conversation
    const conversation = await tx.conversation.create({
      data: {
        isGroupChat: true,
        name: conversationData.name,
        participants: {
          create: [
            { userId },
            ...conversationData.participantIds.map(id => ({ userId: id }))
          ]
        }
      }
    });

    // Create the group tied to this conversation
    const group = await tx.group.create({
      data: {
        name: conversationData.name,
        conversationId: conversation.id,
        createdById: userId,
        members: {
          create: [
            { userId, role: 'ADMIN' as GroupRole },
            ...conversationData.participantIds.map(id => ({ 
              userId: id, 
              role: 'MEMBER' as GroupRole 
            }))
          ]
        }
      },
      include: {
        members: true,
        conversation: true
      }
    });

    // Update the conversation with the group reference
    await tx.conversation.update({
      where: { id: conversation.id },
      data: { groupId: group.id }
    });

    return {
      group,
      conversation
    };
  });
}

/**
 * Adds a user to both a group and its associated conversation
 */
export async function addUserToGroupAndConversation(
  groupId: string,
  userId: string,
  role: GroupRole = 'MEMBER' as GroupRole
) {
  return await prisma.$transaction(async (tx: TransactionClient) => {
    // Get the group with its conversation
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { conversation: true }
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (!group.conversationId) {
      throw new Error('Group has no associated conversation');
    }

    // Add user to group
    const groupMember = await tx.groupUser.create({
      data: {
        groupId,
        userId,
        role
      }
    });

    // Add user to conversation
    const conversationParticipant = await tx.conversationParticipant.create({
      data: {
        conversationId: group.conversationId,
        userId
      }
    });

    return {
      groupMember,
      conversationParticipant
    };
  });
} 