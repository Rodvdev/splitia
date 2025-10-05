import { SupportCategory, SupportPriority, SupportStatus } from '@prisma/client';

// Support ticket configurations
export const SUPPORT_CONFIG = {
  categories: {
    TECHNICAL: {
      id: 'TECHNICAL',
      name: 'Problema Técnico',
      description: 'Errores, bugs o problemas de funcionamiento',
      icon: '🔧',
      priority: 'HIGH' as SupportPriority,
    },
    BILLING: {
      id: 'BILLING',
      name: 'Facturación y Pagos',
      description: 'Problemas con suscripciones, pagos o facturación',
      icon: '💳',
      priority: 'HIGH' as SupportPriority,
    },
    FEATURE_REQUEST: {
      id: 'FEATURE_REQUEST',
      name: 'Solicitud de Funcionalidad',
      description: 'Sugerencias para nuevas características',
      icon: '💡',
      priority: 'LOW' as SupportPriority,
    },
    BUG_REPORT: {
      id: 'BUG_REPORT',
      name: 'Reporte de Error',
      description: 'Reportar errores o comportamientos inesperados',
      icon: '🐛',
      priority: 'MEDIUM' as SupportPriority,
    },
    ACCOUNT: {
      id: 'ACCOUNT',
      name: 'Cuenta y Perfil',
      description: 'Problemas con la cuenta, perfil o configuración',
      icon: '👤',
      priority: 'MEDIUM' as SupportPriority,
    },
    GENERAL: {
      id: 'GENERAL',
      name: 'Consulta General',
      description: 'Preguntas generales o información',
      icon: '❓',
      priority: 'LOW' as SupportPriority,
    },
  },
  priorities: {
    LOW: { name: 'Baja', color: 'green', slaHours: 72 },
    MEDIUM: { name: 'Media', color: 'yellow', slaHours: 24 },
    HIGH: { name: 'Alta', color: 'orange', slaHours: 12 },
    URGENT: { name: 'Urgente', color: 'red', slaHours: 4 },
  },
  statuses: {
    OPEN: { name: 'Abierto', color: 'blue', description: 'Ticket creado, esperando asignación' },
    IN_PROGRESS: { name: 'En Progreso', color: 'orange', description: 'Ticket asignado y siendo trabajado' },
    PENDING_CUSTOMER: { name: 'Esperando Cliente', color: 'yellow', description: 'Esperando respuesta del cliente' },
    RESOLVED: { name: 'Resuelto', color: 'green', description: 'Ticket resuelto, esperando confirmación' },
    CLOSED: { name: 'Cerrado', color: 'gray', description: 'Ticket cerrado definitivamente' },
  },
} as const;

// Support utility functions
export function getCategoryConfig(category: SupportCategory) {
  return SUPPORT_CONFIG.categories[category];
}

export function getPriorityConfig(priority: SupportPriority) {
  return SUPPORT_CONFIG.priorities[priority];
}

export function getStatusConfig(status: SupportStatus) {
  return SUPPORT_CONFIG.statuses[status];
}

export function calculateSLABreach(createdAt: Date, priority: SupportPriority): {
  isBreached: boolean;
  hoursRemaining: number;
  slaHours: number;
} {
  const config = getPriorityConfig(priority);
  const now = new Date();
  const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = config.slaHours - hoursElapsed;
  const isBreached = hoursRemaining < 0;

  return {
    isBreached,
    hoursRemaining: Math.max(0, hoursRemaining),
    slaHours: config.slaHours,
  };
}

export function getNextStatus(currentStatus: SupportStatus): SupportStatus[] {
  const statusFlow: Record<SupportStatus, SupportStatus[]> = {
    OPEN: [SupportStatus.IN_PROGRESS, SupportStatus.CLOSED],
    IN_PROGRESS: [SupportStatus.PENDING_CUSTOMER, SupportStatus.RESOLVED, SupportStatus.CLOSED],
    PENDING_CUSTOMER: [SupportStatus.IN_PROGRESS, SupportStatus.RESOLVED, SupportStatus.CLOSED],
    RESOLVED: [SupportStatus.CLOSED, SupportStatus.IN_PROGRESS],
    CLOSED: [], // Terminal state
  };

  return statusFlow[currentStatus] || [];
}

export function canUserModifyTicket(userRole: string, ticketStatus: SupportStatus): boolean {
  // Admin can modify any ticket
  if (userRole === 'ADMIN') return true;
  
  // Regular users can only modify open tickets
  return ticketStatus === SupportStatus.OPEN;
}

// Support analytics
export function calculateSupportMetrics(tickets: any[]) {
  const metrics = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === SupportStatus.OPEN).length,
    inProgressTickets: tickets.filter(t => t.status === SupportStatus.IN_PROGRESS).length,
    resolvedTickets: tickets.filter(t => t.status === SupportStatus.RESOLVED).length,
    closedTickets: tickets.filter(t => t.status === SupportStatus.CLOSED).length,
    averageResolutionTime: 0,
    slaBreachCount: 0,
    categoryDistribution: {} as Record<string, number>,
    priorityDistribution: {} as Record<string, number>,
  };

  // Calculate average resolution time for closed tickets
  const closedTickets = tickets.filter(t => t.status === SupportStatus.CLOSED && t.resolvedAt);
  if (closedTickets.length > 0) {
    const totalResolutionTime = closedTickets.reduce((sum, ticket) => {
      const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);
    metrics.averageResolutionTime = totalResolutionTime / closedTickets.length / (1000 * 60 * 60); // Hours
  }

  // Calculate SLA breaches
  metrics.slaBreachCount = tickets.filter(ticket => {
    const sla = calculateSLABreach(ticket.createdAt, ticket.priority);
    return sla.isBreached && ticket.status !== SupportStatus.CLOSED;
  }).length;

  // Category distribution
  Object.values(SupportCategory).forEach(category => {
    metrics.categoryDistribution[category] = tickets.filter(t => t.category === category).length;
  });

  // Priority distribution
  Object.values(SupportPriority).forEach(priority => {
    metrics.priorityDistribution[priority] = tickets.filter(t => t.priority === priority).length;
  });

  return metrics;
}

// Auto-assignment logic
export function getOptimalAssignee(
  category: SupportCategory,
  priority: SupportPriority,
  availableAdmins: any[]
): string | null {
  if (availableAdmins.length === 0) return null;

  // Simple round-robin assignment for now
  // In a real system, you'd consider workload, expertise, etc.
  const admin = availableAdmins[Math.floor(Math.random() * availableAdmins.length)];
  return admin.id;
}

// Notification templates
export const NOTIFICATION_TEMPLATES = {
  ticketCreated: {
    subject: 'Ticket de Soporte Creado - #{ticketId}',
    body: 'Tu ticket de soporte ha sido creado exitosamente. Te notificaremos cuando sea asignado a un agente.',
  },
  ticketAssigned: {
    subject: 'Ticket Asignado - #{ticketId}',
    body: 'Tu ticket ha sido asignado a un agente de soporte. Te contactaremos pronto.',
  },
  ticketResolved: {
    subject: 'Ticket Resuelto - #{ticketId}',
    body: 'Tu ticket ha sido marcado como resuelto. Por favor, revisa la solución y confirma si está completo.',
  },
  ticketClosed: {
    subject: 'Ticket Cerrado - #{ticketId}',
    body: 'Tu ticket ha sido cerrado. Si necesitas más ayuda, puedes crear un nuevo ticket.',
  },
  slaBreach: {
    subject: 'SLA Breach Alert - #{ticketId}',
    body: 'Este ticket ha excedido el tiempo de respuesta acordado. Por favor, priorízalo.',
  },
} as const;
