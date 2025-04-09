import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processMessage, sendAIResponse } from '@/lib/ai-assistant';

/**
 * POST /api/ai-assistant/process-message
 * Process a message and generate an AI response if needed
 * Required body: { messageId: string, content: string, conversationId: string, senderId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { messageId, content, conversationId, senderId } = body;

    if (!messageId || !content || !conversationId || !senderId) {
      return NextResponse.json(
        { error: 'Message details required' },
        { status: 400 }
      );
    }

    // Process the message
    const response = await processMessage({
      id: messageId,
      content,
      conversationId,
      senderId,
    });

    // If there's no AI response needed, return success
    if (!response) {
      return NextResponse.json({ 
        success: true, 
        message: 'No AI response required' 
      });
    }

    // Send the AI response
    const aiMessage = await sendAIResponse({
      conversationId: response.conversationId,
      senderId: response.senderId,
      response: response.response,
    });

    return NextResponse.json({
      success: true,
      responseType: response.type,
      responseMessage: aiMessage,
    });
  } catch (error) {
    console.error('Error processing message:', error);
    
    return NextResponse.json(
      { error: 'Failed to process message', details: (error as Error).message },
      { status: 500 }
    );
  }
} 