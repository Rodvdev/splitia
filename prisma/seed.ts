import { PrismaClient } from '@prisma/client';
import { createGroupWithConversation, createGroupChatWithGroup } from '../src/lib/conversations';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const password = await hash('password123', 10);
  
  const user1 = await prisma.user.create({
    data: {
      name: 'Test User 1',
      email: 'user1@example.com',
      password,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Test User 2',
      email: 'user2@example.com',
      password,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Test User 3',
      email: 'user3@example.com',
      password,
    },
  });

  console.log('Created test users');

  // Create a group with associated conversation
  const group = await createGroupWithConversation(user1.id, {
    name: 'Test Group',
    description: 'A test group with conversation',
  });

  console.log('Created group with conversation:', group.id);

  // Create a group chat with associated group
  const { group: groupChat, conversation } = await createGroupChatWithGroup(user1.id, {
    name: 'Test Group Chat',
    participantIds: [user2.id, user3.id],
  });

  console.log('Created group chat with associated group:', {
    groupId: groupChat.id,
    conversationId: conversation.id,
  });

  // Add a welcome message
  await prisma.message.create({
    data: {
      content: 'Welcome to the test group chat!',
      conversationId: conversation.id,
      senderId: user1.id,
      isAI: true,
    },
  });

  // Create an AI assistant user
  const aiUser = await prisma.user.upsert({
    where: { email: 'ai-assistant@splitia.app' },
    update: {},
    create: {
      name: 'Splitia Assistant',
      email: 'ai-assistant@splitia.app',
      password: 'ai-password-not-used', // Not used since AI won't log in
      image: '/images/ai-avatar.png',
      externalId: 'ai-assistant',
    },
  });

  console.log('AI assistant created/updated:', aiUser.id);

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });