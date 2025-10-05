'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  AlertTriangle, 
  Bug, 
  CreditCard, 
  User, 
  Lightbulb,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/support';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  messages: any[];
  _count: {
    messages: number;
    attachments: number;
  };
}

interface SupportTicketListProps {
  tickets: SupportTicket[];
  onTicketClick: (ticketId: string) => void;
  isLoading?: boolean;
  isAdmin?: boolean;
}

const categoryIcons = {
  TECHNICAL: AlertTriangle,
  BILLING: CreditCard,
  FEATURE_REQUEST: Lightbulb,
  BUG_REPORT: Bug,
  ACCOUNT: User,
  GENERAL: MessageSquare,
};

const statusIcons = {
  OPEN: Clock,
  IN_PROGRESS: Clock,
  PENDING_CUSTOMER: Clock,
  RESOLVED: CheckCircle,
  CLOSED: XCircle,
};

export function SupportTicketList({ 
  tickets, 
  onTicketClick, 
  isLoading, 
  isAdmin = false 
}: SupportTicketListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const getStatusBadge = (status: string) => {
    const config = SUPPORT_CONFIG.statuses[status as keyof typeof SUPPORT_CONFIG.statuses];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge 
        variant={config.color === 'blue' ? 'default' : 'secondary'}
        className={
          config.color === 'green' ? 'bg-green-500' :
          config.color === 'orange' ? 'bg-orange-500' :
          config.color === 'yellow' ? 'bg-yellow-500' :
          config.color === 'red' ? 'bg-red-500' :
          ''
        }
      >
        {config.name}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = SUPPORT_CONFIG.priorities[priority as keyof typeof SUPPORT_CONFIG.priorities];
    if (!config) return <Badge variant="outline">{priority}</Badge>;

    return (
      <Badge 
        variant="outline"
        className={
          config.color === 'green' ? 'border-green-500 text-green-700' :
          config.color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
          config.color === 'orange' ? 'border-orange-500 text-orange-700' :
          config.color === 'red' ? 'border-red-500 text-red-700' :
          ''
        }
      >
        {config.name}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesCategory = !categoryFilter || ticket.category === categoryFilter;
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los estados</SelectItem>
                {Object.entries(SUPPORT_CONFIG.statuses).map(([key, status]) => (
                  <SelectItem key={key} value={key}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las categorías</SelectItem>
                {Object.entries(SUPPORT_CONFIG.categories).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(key)}
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las prioridades</SelectItem>
                {Object.entries(SUPPORT_CONFIG.priorities).map(([key, priority]) => (
                  <SelectItem key={key} value={key}>
                    {priority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Soporte</CardTitle>
          <CardDescription>
            {filteredTickets.length} ticket(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                No se encontraron tickets con los filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onTicketClick(ticket.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(ticket.category)}
                        <h3 className="font-semibold">{ticket.title}</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Creado: {formatDate(ticket.createdAt)}</span>
                        <span>Actualizado: {formatDate(ticket.updatedAt)}</span>
                        {ticket._count.messages > 0 && (
                          <span>{ticket._count.messages} mensaje(s)</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        {getStatusBadge(ticket.status)}
                      </div>
                      {getPriorityBadge(ticket.priority)}
                      
                      {isAdmin && ticket.assignedTo && (
                        <div className="text-sm text-muted-foreground">
                          Asignado a: {ticket.assignedTo.name} {ticket.assignedTo.lastName}
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
