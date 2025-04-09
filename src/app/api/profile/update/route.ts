import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth/get-user-id';

type ProfileUpdateData = {
  name?: string;
  currency?: string;
  language?: string;
  image?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, currency, language, image } = body;

    // Get the user ID
    const userId = await getUserId();

    // If no user ID, return unauthorized
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build update data object
    const updateData: ProfileUpdateData = {};
    if (name) updateData.name = name;
    if (currency) updateData.currency = currency;
    if (language) updateData.language = language;
    if (image) updateData.image = image;

    // Return error if no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        currency: true,
        language: true,
        updatedAt: true
      }
    });

    // Return the updated user data
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Error updating user profile' },
      { status: 500 }
    );
  }
} 