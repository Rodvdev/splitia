import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addAIAssistantToGroup, createAIAssistant, getAIAssistant } from '@/lib/ai-assistant';

/**
 * POST /api/ai-assistant/add-to-group
 * Add AI Assistant to a group
 * Required body: { groupId: string }
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
    const { groupId } = body;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Check if AI Assistant exists, create if not
    let aiAssistant = await getAIAssistant();
    if (!aiAssistant) {
      console.log('AI Assistant not found, creating...');
      aiAssistant = await createAIAssistant();
    }

    // Add AI Assistant to the group
    const result = await addAIAssistantToGroup(groupId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error adding AI Assistant to group:', error);
    
    return NextResponse.json(
      { error: 'Failed to add AI Assistant to group', details: (error as Error).message },
      { status: 500 }
    );
  }
} 