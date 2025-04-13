import { prisma } from './prisma';
import { addUserToGroupAndConversation } from './conversations';
import { hash } from 'bcrypt';

// Define GroupRole enum to match the Prisma schema
enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
  ASSISTANT = 'ASSISTANT'
}


const AI_ASSISTANT_EMAIL = 'ai-assistant@splitia.app';

/**
 * Create the AI Assistant user in the database
 * @returns The AI Assistant user object
 */
export async function createAIAssistant() {
  console.log('Creating AI Assistant user...');
  try {
    const password = await hash('ai-password-not-used', 10);
    
    const aiAssistant = await prisma.user.upsert({
      where: { email: AI_ASSISTANT_EMAIL },
      update: {},
      create: {
        name: 'Splitia Assistant AI',
        email: AI_ASSISTANT_EMAIL,
        password,
        image: '/images/ai-avatar.png',
        externalId: 'ai-assistant',
      },
    });
    
    console.log('AI Assistant user created/updated:', aiAssistant.id);
    return aiAssistant;
  } catch (error) {
    console.error('Error creating AI Assistant user:', error);
    throw error;
  }
}

/**
 * Get the AI Assistant user from the database
 * @returns The AI Assistant user object or null if not found
 */
export async function getAIAssistant() {
  return await prisma.user.findUnique({
    where: { email: AI_ASSISTANT_EMAIL },
  });
}

/**
 * Add the AI Assistant to a group
 * @param groupId The ID of the group to add the AI Assistant to
 * @returns The result of adding the AI Assistant to the group
 */
export async function addAIAssistantToGroup(groupId: string) {
  // Find the AI Assistant user
  const aiAssistant = await getAIAssistant();
  
  if (!aiAssistant) {
    throw new Error('AI Assistant user not found in the database');
  }
  
  // Check if the AI Assistant is already in the group
  const existingMembership = await prisma.groupUser.findFirst({
    where: {
      userId: aiAssistant.id,
      groupId,
    },
  });
  
  if (existingMembership) {
    return { success: true, message: 'AI Assistant is already a member of this group' };
  }
  
  // Add the AI Assistant to the group
  const result = await addUserToGroupAndConversation(groupId, aiAssistant.id, 'ASSISTANT' as GroupRole);
  
  // Send a welcome message from the AI Assistant
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { conversation: true },
  });
  
  if (group && group.conversation) {
    await prisma.message.create({
      data: {
        content: '¡Hola! Soy el asistente de Splitia. Estoy aquí para ayudarte a gestionar tus gastos. Puedes pedirme que añada gastos, registre pagos o consulte saldos. Por ejemplo, puedes escribir: "Gasté 50 soles en comida y hay que dividirlo entre todos".',
        conversationId: group.conversation.id,
        senderId: aiAssistant.id,
        isAI: true,
      },
    });
  }
  
  return { success: true, result };
}

/**
 * Process a message and generate an AI Assistant response if needed
 * @param message The message object
 * @returns The AI Assistant response if applicable, null otherwise
 */
export async function processMessage(message: {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
}) {
  // Check if this is a message from the AI Assistant
  const aiAssistant = await getAIAssistant();
  
  if (!aiAssistant || message.senderId === aiAssistant.id) {
    return null; // Don't respond to our own messages
  }
  
  // Get the conversation to check if it's a group chat
  const conversation = await prisma.conversation.findUnique({
    where: { id: message.conversationId },
    include: {
      participants: {
        include: { user: true },
      },
      group: true,
    },
  });
  
  if (!conversation || !conversation.isGroupChat) {
    return null; // Only respond in group chats
  }
  
  // Check if the AI Assistant is a participant
  const aiIsParticipant = conversation.participants.some(
    (p: { user: { id: string } }) => p.user.id === aiAssistant.id
  );
  
  if (!aiIsParticipant) {
    return null; // AI is not in this conversation
  }
  
  // Process the message content
  const lowerContent = message.content.toLowerCase();

  // Check for expense patterns
  if (
    (lowerContent.includes('gast') || lowerContent.includes('pag')) &&
    (lowerContent.includes('sol') || 
     lowerContent.includes('dólar') || 
     lowerContent.includes('dolar') || 
     lowerContent.includes('€') || 
     lowerContent.includes('euro') || 
     lowerContent.includes('$'))
  ) {
    // Extract amount using regex - find a number followed by a currency reference
    const amountMatch = message.content.match(/(\d+)(?:\s*)(?:soles|sol|dólares|dolares|euros|€|\$)/i);
    
    if (amountMatch && amountMatch[1]) {
      const amount = parseInt(amountMatch[1], 10);
      
      // Check if "dividir" or "entre todos" is mentioned
      const shouldSplit = lowerContent.includes('divid') || 
                          lowerContent.includes('entre todos') || 
                          lowerContent.includes('split');
      
      if (shouldSplit) {
        return {
          type: 'EXPENSE_SPLIT_CONFIRMATION',
          amount,
          currency: lowerContent.includes('sol') ? 'PEN' : 
                    lowerContent.includes('dólar') || lowerContent.includes('dolar') || lowerContent.includes('$') ? 'USD' : 'EUR',
          originalMessage: message.id,
          conversationId: message.conversationId,
          senderId: aiAssistant.id,
          response: `¿Deseas agregar un gasto de ${amount} ${lowerContent.includes('sol') ? 'soles' : 
                     lowerContent.includes('dólar') || lowerContent.includes('dolar') || lowerContent.includes('$') ? 'dólares' : 'euros'} al grupo y dividirlo entre todos?`
        };
      } else {
        return {
          type: 'EXPENSE_CONFIRMATION',
          amount,
          currency: lowerContent.includes('sol') ? 'PEN' : 
                    lowerContent.includes('dólar') || lowerContent.includes('dolar') || lowerContent.includes('$') ? 'USD' : 'EUR',
          originalMessage: message.id,
          conversationId: message.conversationId,
          senderId: aiAssistant.id,
          response: `¿Entre quiénes dividimos el gasto de ${amount} ${lowerContent.includes('sol') ? 'soles' : 
                     lowerContent.includes('dólar') || lowerContent.includes('dolar') || lowerContent.includes('$') ? 'dólares' : 'euros'}?`
        };
      }
    }
  }
  
  // Check for payment confirmation
  if (lowerContent.includes('pag') && lowerContent.includes('parte')) {
    // Find the sender of the message mentioning the payment
    const sender = await prisma.user.findUnique({
      where: { id: message.senderId },
      select: { name: true },
    });
    
    // Get the group owner or an admin to confirm
    const group = conversation.group;
    
    if (group) {
      const admins = await prisma.groupUser.findMany({
        where: {
          groupId: group.id,
          role: 'ADMIN',
        },
        include: {
          user: true,
        },
      });
      
      if (admins.length > 0) {
        const admin = admins[0];
        
        return {
          type: 'PAYMENT_CONFIRMATION',
          payerId: message.senderId,
          confirmerId: admin.user.id,
          originalMessage: message.id,
          conversationId: message.conversationId,
          senderId: aiAssistant.id,
          response: `${admin.user.name}, ¿confirmas que ${sender?.name || 'este usuario'} ha pagado su parte?`
        };
      }
    }
  }
  
  // Check for confirmation responses
  if (lowerContent === 'sí' || lowerContent === 'si' || lowerContent === 'yes') {
    // Would need to track prior messages to determine what's being confirmed
    // For this example, we'll just provide a generic success response
    return {
      type: 'CONFIRMATION_ACKNOWLEDGED',
      originalMessage: message.id,
      conversationId: message.conversationId,
      senderId: aiAssistant.id,
      response: 'Perfecto, he registrado esa información.'
    };
  }
  
  return null;
}

/**
 * Send an AI response to a message
 * @param responseData The AI response data
 * @returns The created message
 */
export async function sendAIResponse(responseData: {
  conversationId: string;
  senderId: string;
  response: string;
}) {
  return await prisma.message.create({
    data: {
      content: responseData.response,
      conversationId: responseData.conversationId,
      senderId: responseData.senderId,
      isAI: true,
    },
  });
}
