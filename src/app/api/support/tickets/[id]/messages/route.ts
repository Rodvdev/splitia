import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { content, isInternal } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        assignedToId: true,
        status: true,
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasAccess = 
      session.user.role === 'ADMIN' || 
      ticket.createdById === session.user.id ||
      ticket.assignedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para agregar mensajes a este ticket' },
        { status: 403 }
      );
    }

    // Only admins can send internal messages
    if (isInternal && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Solo los administradores pueden enviar mensajes internos' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.supportMessage.create({
      data: {
        content: content.trim(),
        isInternal: isInternal || false,
        ticketId: params.id,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            lastName: true,
            role: true,
          }
        }
      }
    });

    // Update ticket status based on message sender
    const updateData: any = {
      updatedAt: new Date(),
    };

    // If customer replies, change status to PENDING_CUSTOMER
    if (ticket.createdById === session.user.id && ticket.status !== 'OPEN') {
      updateData.status = 'PENDING_CUSTOMER';
    }
    // If admin replies, change status to IN_PROGRESS
    else if (session.user.role === 'ADMIN' && ticket.status === 'PENDING_CUSTOMER') {
      updateData.status = 'IN_PROGRESS';
    }

    await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error creating support message:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el mensaje' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        createdById: true,
        assignedToId: true,
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Check permissions
    const hasAccess = 
      session.user.role === 'ADMIN' || 
      ticket.createdById === session.user.id ||
      ticket.assignedToId === session.user.id;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver los mensajes de este ticket' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where: {
          ticketId: params.id,
          // Regular users can't see internal messages
          ...(session.user.role !== 'ADMIN' ? { isInternal: false } : {}),
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc'
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              lastName: true,
              role: true,
            }
          }
        }
      }),
      prisma.supportMessage.count({
        where: {
          ticketId: params.id,
          ...(session.user.role !== 'ADMIN' ? { isInternal: false } : {}),
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los mensajes' },
      { status: 500 }
    );
  }
}
