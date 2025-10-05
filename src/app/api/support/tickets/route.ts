import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SUPPORT_CONFIG, calculateSupportMetrics } from '@/lib/support';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // Regular users can only see their own tickets
    // Admins can see all tickets
    if (session.user.role !== 'ADMIN') {
      where.createdById = session.user.id;
    }

    // Admin-specific filters
    if (assignedToMe && session.user.role === 'ADMIN') {
      where.assignedToId = session.user.id;
    }

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
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
              createdAt: 'desc'
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  lastName: true,
                }
              }
            }
          },
          _count: {
            select: {
              messages: true,
              attachments: true,
            }
          }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener los tickets de soporte' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { title, description, category, priority } = await request.json();

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(SUPPORT_CONFIG.categories).some(c => c.id === category)) {
      return NextResponse.json(
        { success: false, error: 'Categoría inválida' },
        { status: 400 }
      );
    }

    // Create ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        category,
        priority: priority || SUPPORT_CONFIG.categories[category as keyof typeof SUPPORT_CONFIG.categories]?.priority || 'MEDIUM',
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Auto-assign to available admin (if any)
    const availableAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        assignedTickets: {
          some: {
            status: {
              in: ['OPEN', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    // Find admin with least tickets
    const adminWorkload = await prisma.supportTicket.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: {
          not: null
        },
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'asc'
        }
      }
    });

    let assignedToId = null;
    if (adminWorkload.length > 0) {
      assignedToId = adminWorkload[0].assignedToId;
    }

    // Update ticket with assignment
    if (assignedToId) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          assignedToId,
          status: 'IN_PROGRESS',
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear el ticket de soporte' },
      { status: 500 }
    );
  }
}
