import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserModifyTicket, getNextStatus } from '@/lib/support';

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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          }
        },
        messages: {
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
        },
        attachments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role !== 'ADMIN' && ticket.createdById !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver este ticket' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el ticket de soporte' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { status, priority, assignedToId, resolution } = await request.json();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
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
    const canModify = canUserModifyTicket(session.user.role || 'USER', ticket.status);
    if (!canModify) {
      return NextResponse.json(
        { success: false, error: 'No puedes modificar este ticket en su estado actual' },
        { status: 403 }
      );
    }

    // Validate status transition
    if (status && status !== ticket.status) {
      const validNextStatuses = getNextStatus(ticket.status);
      if (!validNextStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Transición de estado inválida' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (resolution) updateData.resolution = resolution;
    
    // Set resolvedAt when status changes to RESOLVED
    if (status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    // Clear resolvedAt when status changes from RESOLVED
    if (ticket.status === 'RESOLVED' && status !== 'RESOLVED') {
      updateData.resolvedAt = null;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el ticket de soporte' },
      { status: 500 }
    );
  }
}
