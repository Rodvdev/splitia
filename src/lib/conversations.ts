import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

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
  return await prisma.$transaction(async (tx: PrismaClient) => {
    // Create the conversation first
    const conversation = await tx.conversation.create({
      data: {
        isGroupChat: true,
        // We don't need to set name here as it will use the group name
      }
    });

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
            role: 'ADMIN'
          }
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

    // Add group creator as conversation participant
    await tx.conversationParticipant.create({
      data: {
        conversationId: conversation.id,
        userId: userId
      }
    });

    return group;
  });
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
  return await prisma.$transaction(async (tx: PrismaClient) => {
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
            { userId, role: 'ADMIN' },
            ...conversationData.participantIds.map(id => ({ 
              userId: id, 
              role: 'MEMBER' 
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
  role: 'ADMIN' | 'MEMBER' | 'GUEST' | 'ASSISTANT' = 'MEMBER'
) {
  return await prisma.$transaction(async (tx: PrismaClient) => {
    // Get the group with its conversation
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { conversation: true }
    });

    if (!group) {
      throw new Error('Group not found');
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